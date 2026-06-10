import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  ProfileStatus,
  Property,
  PropertyImage,
  PropertyPurpose,
  PropertyStatus,
  RoleName,
} from '@prisma/client';
import { CategoryService } from '../category/category.service';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MAX_PROPERTY_IMAGES } from '../upload/upload.constants';
import { UploadService } from '../upload/upload.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { QueryOwnerPropertyDto, QueryPropertyDto } from './dto/query-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

type PropertyWithRelations = Property & {
  category: { id: string; name: string; slug: string; parentId: string | null };
  images: PropertyImage[];
  owner?: { id: string; name: string };
};

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoryService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    await this.assertCanManageProperties(ownerId);
    await this.categoryService.assertLeafCategory(dto.categoryId);

    const property = await this.prisma.property.create({
      data: this.toCreateData(ownerId, dto),
      include: this.defaultInclude(),
    });

    return this.mapProperty(property);
  }

  async findApproved(query: QueryPropertyDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.APPROVED,
      ...(query.purpose ? { purpose: query.purpose } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.defaultInclude(),
      }),
      this.prisma.property.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapProperty(item)),
      total,
      page,
      limit,
    );
  }

  async findMine(ownerId: string, query: QueryOwnerPropertyDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where: Prisma.PropertyWhereInput = {
      ownerId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: this.defaultInclude(),
      }),
      this.prisma.property.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapProperty(item)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string, viewer?: { id: string; role: string }) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        ...this.defaultInclude(),
        owner: { select: { id: true, name: true } },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const isOwner = viewer?.id === property.ownerId;
    const isAdmin = viewer?.role === RoleName.ADMIN;

    if (
      property.status !== PropertyStatus.APPROVED &&
      !isOwner &&
      !isAdmin
    ) {
      throw new NotFoundException('Property not found');
    }

    return this.mapProperty(property);
  }

  async update(propertyId: string, ownerId: string, dto: UpdatePropertyDto) {
    const property = await this.findOwnedEditableProperty(propertyId, ownerId);

    if (dto.categoryId) {
      await this.categoryService.assertLeafCategory(dto.categoryId);
    }

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: this.toUpdateData(dto),
      include: this.defaultInclude(),
    });

    return this.mapProperty(updated);
  }

  async remove(propertyId: string, ownerId: string) {
    const property = await this.findOwnedEditableProperty(propertyId, ownerId);

    for (const image of property.images) {
      await this.uploadService.deleteLocalFile(image.imageUrl);
    }

    await this.prisma.property.delete({ where: { id: property.id } });

    return { message: 'Property deleted successfully' };
  }

  async submitForReview(propertyId: string, ownerId: string) {
    const property = await this.findOwnedEditableProperty(propertyId, ownerId);

    if (property.images.length === 0) {
      throw new BadRequestException(
        'At least one image is required before submitting for review',
      );
    }

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: {
        status: PropertyStatus.PENDING,
        submittedAt: new Date(),
        rejectionReason: null,
      },
      include: this.defaultInclude(),
    });

    return {
      message: 'Property submitted for admin review',
      property: this.mapProperty(updated),
    };
  }

  async markSold(propertyId: string, ownerId: string) {
    return this.markFinalStatus(
      propertyId,
      ownerId,
      PropertyPurpose.SALE,
      PropertyStatus.SOLD,
    );
  }

  async markRented(propertyId: string, ownerId: string) {
    return this.markFinalStatus(
      propertyId,
      ownerId,
      PropertyPurpose.RENT,
      PropertyStatus.RENTED,
    );
  }

  async adminFindAll(query: QueryOwnerPropertyDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where: Prisma.PropertyWhereInput = query.status
      ? { status: query.status }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          ...this.defaultInclude(),
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapProperty(item)),
      total,
      page,
      limit,
    );
  }

  async adminFindPending(query: QueryOwnerPropertyDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = { status: PropertyStatus.PENDING };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'asc' },
        include: {
          ...this.defaultInclude(),
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapProperty(item)),
      total,
      page,
      limit,
    );
  }

  async adminApprove(propertyId: string) {
    const property = await this.findPropertyOrFail(propertyId);

    if (property.status !== PropertyStatus.PENDING) {
      throw new BadRequestException('Only pending properties can be approved');
    }

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: {
        status: PropertyStatus.APPROVED,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      include: this.defaultInclude(),
    });

    return {
      message: 'Property approved',
      property: this.mapProperty(updated),
    };
  }

  async adminReject(propertyId: string, reason: string) {
    const property = await this.findPropertyOrFail(propertyId);

    if (property.status !== PropertyStatus.PENDING) {
      throw new BadRequestException('Only pending properties can be rejected');
    }

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: {
        status: PropertyStatus.REJECTED,
        rejectionReason: reason,
      },
      include: this.defaultInclude(),
    });

    return {
      message: 'Property rejected',
      property: this.mapProperty(updated),
    };
  }

  assertEditableStatus(status: PropertyStatus): void {
    if (
      status !== PropertyStatus.DRAFT &&
      status !== PropertyStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Property can only be edited while DRAFT or REJECTED',
      );
    }
  }

  async findOwnedProperty(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    if (!property || property.ownerId !== ownerId) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async findOwnedEditableProperty(propertyId: string, ownerId: string) {
    const property = await this.findOwnedProperty(propertyId, ownerId);
    this.assertEditableStatus(property.status);
    return property;
  }

  async countPropertyImages(propertyId: string): Promise<number> {
    return this.prisma.propertyImage.count({ where: { propertyId } });
  }

  getAppUrl(): string {
    return this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  mapProperty(property: PropertyWithRelations & { owner?: { id: string; name: string; email?: string | null; phone?: string | null } }) {
    const appUrl = this.getAppUrl();

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price.toNumber(),
      city: property.city,
      area: property.area,
      address: property.address,
      latitude: property.latitude?.toNumber() ?? null,
      longitude: property.longitude?.toNumber() ?? null,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSize: property.areaSize?.toNumber() ?? null,
      purpose: property.purpose,
      status: property.status,
      categoryId: property.categoryId,
      category: property.category,
      ownerId: property.ownerId,
      owner: property.owner ?? undefined,
      rejectionReason: property.rejectionReason,
      submittedAt: property.submittedAt,
      approvedAt: property.approvedAt,
      images: property.images
        .sort((a, b) => a.order - b.order)
        .map((image) => ({
          id: image.id,
          imageUrl: this.uploadService.toPublicUrl(image.imageUrl, appUrl),
          isPrimary: image.isPrimary,
          order: image.order,
        })),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  private async assertCanManageProperties(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, ownerProfile: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role.name === RoleName.ADMIN) {
      return;
    }

    if (user.role.name !== RoleName.OWNER) {
      throw new ForbiddenException('Only verified owners can manage properties');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Email must be verified before listing properties');
    }

    if (user.ownerProfile?.profileStatus !== ProfileStatus.VERIFIED) {
      throw new ForbiddenException(
        'Owner KYC must be approved before listing properties',
      );
    }
  }

  private async findPropertyOrFail(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  private async markFinalStatus(
    propertyId: string,
    ownerId: string,
    expectedPurpose: PropertyPurpose,
    nextStatus: PropertyStatus,
  ) {
    const property = await this.findOwnedProperty(propertyId, ownerId);

    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException('Only approved properties can be updated');
    }

    if (property.purpose !== expectedPurpose) {
      throw new BadRequestException(
        `This property is listed for ${property.purpose}, not ${expectedPurpose}`,
      );
    }

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: { status: nextStatus },
      include: this.defaultInclude(),
    });

    return {
      message: `Property marked as ${nextStatus}`,
      property: this.mapProperty(updated),
    };
  }

  private defaultInclude() {
    return {
      category: {
        select: { id: true, name: true, slug: true, parentId: true },
      },
      images: { orderBy: { order: 'asc' as const } },
    };
  }

  private toCreateData(ownerId: string, dto: CreatePropertyDto): Prisma.PropertyCreateInput {
    return {
      title: dto.title.trim(),
      description: dto.description.trim(),
      price: new Prisma.Decimal(dto.price),
      city: dto.city.trim(),
      area: dto.area.trim(),
      address: dto.address.trim(),
      latitude:
        dto.latitude !== undefined ? new Prisma.Decimal(dto.latitude) : undefined,
      longitude:
        dto.longitude !== undefined ? new Prisma.Decimal(dto.longitude) : undefined,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      areaSize:
        dto.areaSize !== undefined ? new Prisma.Decimal(dto.areaSize) : undefined,
      purpose: dto.purpose,
      status: PropertyStatus.DRAFT,
      category: { connect: { id: dto.categoryId } },
      owner: { connect: { id: ownerId } },
    };
  }

  private toUpdateData(dto: UpdatePropertyDto): Prisma.PropertyUpdateInput {
    return {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description.trim() }
        : {}),
      ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
      ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
      ...(dto.area !== undefined ? { area: dto.area.trim() } : {}),
      ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
      ...(dto.latitude !== undefined
        ? { latitude: new Prisma.Decimal(dto.latitude) }
        : {}),
      ...(dto.longitude !== undefined
        ? { longitude: new Prisma.Decimal(dto.longitude) }
        : {}),
      ...(dto.bedrooms !== undefined ? { bedrooms: dto.bedrooms } : {}),
      ...(dto.bathrooms !== undefined ? { bathrooms: dto.bathrooms } : {}),
      ...(dto.areaSize !== undefined
        ? { areaSize: new Prisma.Decimal(dto.areaSize) }
        : {}),
      ...(dto.purpose !== undefined ? { purpose: dto.purpose } : {}),
      ...(dto.categoryId !== undefined
        ? { category: { connect: { id: dto.categoryId } } }
        : {}),
    };
  }
}

export { MAX_PROPERTY_IMAGES };
