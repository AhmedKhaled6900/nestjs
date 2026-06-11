import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Prisma,
  ProfileStatus,
  Property,
  PropertyImage,
  PropertyPurpose,
  PricePeriod,
  PropertyStatus,
  AttributeType,
  RentalSource,
  RentalStatus,
  RoleName,
} from '@prisma/client';
import { buildPropertyRentalPayload, PropertyViewer } from '../rental/rental-payload';
import { PropertyAttributeService } from '../attribute/property-attribute.service';
import { CategoryService } from '../category/category.service';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_EVENTS } from '../notification/events/notification.events';
import { MAX_PROPERTY_IMAGES } from '../upload/upload.constants';
import { UploadService } from '../upload/upload.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { QueryOwnerPropertyDto, QueryPropertyDto } from './dto/query-property.dto';
import { QuerySimilarPropertiesDto } from './dto/query-similar-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

const SIMILAR_BEDROOMS_DELTA = 1;
const SIMILAR_PRICE_TOLERANCE_RATIO = 1 / 6;

type PropertyWithRelations = Property & {
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent: { id: string; name: string; slug: string } | null;
  };
  images: PropertyImage[];
  owner?: { id: string; name: string };
  rentals?: Array<{
    id: string;
    source: RentalSource;
    agreedPrice: Prisma.Decimal;
    pricePeriod: PricePeriod;
    duration: number;
    startedAt: Date;
    endsAt: Date;
    status: RentalStatus;
    notes: string | null;
    offerId: string | null;
    tenantId: string;
    tenant: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    };
  }>;
  attributeValues?: Array<{
    id: string;
    attributeId: string | null;
    customName: string | null;
    customType: AttributeType | null;
    value: Prisma.JsonValue;
    attribute: {
      id: string;
      name: string;
      slug: string;
      type: AttributeType;
    } | null;
  }>;
};

export type { PropertyViewer };

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoryService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly propertyAttributeService: PropertyAttributeService,
  ) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    await this.assertCanManageProperties(ownerId);
    await this.categoryService.assertSubcategoryUnderParent(
      dto.subcategoryId,
      dto.parentCategoryId,
    );
    await this.categoryService.assertLeafCategory(dto.subcategoryId);
    this.validatePricePeriod(dto.purpose, dto.pricePeriod);

    const property = await this.prisma.property.create({
      data: this.toCreateData(ownerId, dto),
      include: this.defaultInclude(),
    });

    await this.propertyAttributeService.replaceForProperty(
      property.id,
      dto.subcategoryId,
      {
        attributes: dto.attributes,
        customAttributes: dto.customAttributes,
      },
    );

    const withAttributes = await this.prisma.property.findUniqueOrThrow({
      where: { id: property.id },
      include: this.defaultInclude(),
    });

    return this.mapProperty(withAttributes);
  }

  async findApproved(
    query: QueryPropertyDto,
    viewer?: PropertyViewer,
  ) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const categoryFilter = await this.categoryService.buildPropertyCategoryFilter(
      query,
    );

    const where: Prisma.PropertyWhereInput = {
      status: { in: [PropertyStatus.APPROVED, PropertyStatus.RENTED] },
      ...(query.purpose ? { purpose: query.purpose } : {}),
      ...(query.pricePeriod ? { pricePeriod: query.pricePeriod } : {}),
      ...categoryFilter,
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
      items.map((item) => this.mapProperty(item, viewer)),
      total,
      page,
      limit,
    );
  }

  async findMine(ownerId: string, query: QueryOwnerPropertyDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const categoryFilter = await this.categoryService.buildPropertyCategoryFilter(
      query,
    );

    const where: Prisma.PropertyWhereInput = {
      ownerId,
      ...(query.status ? { status: query.status } : {}),
      ...categoryFilter,
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
      items.map((item) =>
        this.mapProperty(item, { id: ownerId, role: RoleName.OWNER }),
      ),
      total,
      page,
      limit,
    );
  }

  async findById(id: string, viewer?: PropertyViewer) {
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
      property.status !== PropertyStatus.RENTED &&
      !isOwner &&
      !isAdmin
    ) {
      throw new NotFoundException('Property not found');
    }

    return this.mapProperty(property, viewer);
  }

  async findSimilar(query: QuerySimilarPropertiesDto) {
    const subcategoryId = await this.resolveSimilarSubcategoryId(
      query.subcategoryId,
      query.type,
    );
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const criteria = this.buildSimilarCriteria({
      city: query.city,
      subcategoryId,
      bedrooms: query.bedrooms,
      price: query.price,
      purpose: query.purpose,
      excludePropertyId: query.excludePropertyId,
    });

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where: criteria.where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.defaultInclude(),
      }),
      this.prisma.property.count({ where: criteria.where }),
    ]);

    const result = buildPaginatedResult(
      items.map((item) => this.mapProperty(item)),
      total,
      page,
      limit,
    );

    return {
      criteria: criteria.filters,
      ...result,
    };
  }

  async findSimilarById(
    propertyId: string,
    query: Pick<QuerySimilarPropertiesDto, 'page' | 'limit'>,
    viewer?: { id: string; role: string },
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        status: true,
        ownerId: true,
        city: true,
        categoryId: true,
        bedrooms: true,
        price: true,
        purpose: true,
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

    return this.findSimilar({
      city: property.city,
      subcategoryId: property.categoryId,
      bedrooms: property.bedrooms ?? undefined,
      price: property.price.toNumber(),
      purpose: property.purpose,
      excludePropertyId: property.id,
      page: query.page,
      limit: query.limit,
    });
  }

  async update(propertyId: string, ownerId: string, dto: UpdatePropertyDto) {
    const property = await this.findOwnedEditableProperty(propertyId, ownerId);

    const nextPurpose = dto.purpose ?? property.purpose;
    const nextPricePeriod =
      dto.pricePeriod !== undefined ? dto.pricePeriod : property.pricePeriod;
    this.validatePricePeriod(nextPurpose, nextPricePeriod);

    if (dto.subcategoryId || dto.parentCategoryId) {
      const subId = dto.subcategoryId;
      const parentId = dto.parentCategoryId;
      if (!subId || !parentId) {
        throw new BadRequestException(
          'parentCategoryId and subcategoryId must be provided together',
        );
      }
      await this.categoryService.assertSubcategoryUnderParent(subId, parentId);
      await this.categoryService.assertLeafCategory(subId);
    } else if (dto.categoryId) {
      await this.categoryService.assertLeafCategory(dto.categoryId);
    }

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: this.toUpdateData(dto),
      include: this.defaultInclude(),
    });

    const nextSubcategoryId =
      dto.subcategoryId ?? dto.categoryId ?? property.categoryId;

    if (
      dto.attributes !== undefined ||
      dto.customAttributes !== undefined ||
      dto.subcategoryId !== undefined ||
      dto.categoryId !== undefined
    ) {
      await this.propertyAttributeService.replaceForProperty(
        updated.id,
        nextSubcategoryId,
        {
          attributes: dto.attributes,
          customAttributes: dto.customAttributes,
        },
      );
    }

    const withAttributes = await this.prisma.property.findUniqueOrThrow({
      where: { id: updated.id },
      include: this.defaultInclude(),
    });

    return this.mapProperty(withAttributes);
  }

  async remove(propertyId: string, ownerId: string) {
    const property = await this.findOwnedEditableProperty(propertyId, ownerId);

    for (const image of property.images) {
      await this.uploadService.deleteLocalFile(image.imageUrl);
    }

    await this.uploadService.deleteLocalFile(property.videoUrl);

    await this.prisma.property.delete({ where: { id: property.id } });

    return { message: 'Property deleted successfully' };
  }

  async uploadVideo(
    propertyId: string,
    ownerId: string,
    file: Express.Multer.File,
  ) {
    const property = await this.findOwnedEditableProperty(propertyId, ownerId);

    if (!file) {
      throw new BadRequestException('video file is required');
    }

    if (property.videoUrl) {
      await this.uploadService.deleteLocalFile(property.videoUrl);
    }

    const videoUrl = await this.uploadService.savePropertyVideo(file, property.id);

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: { videoUrl },
      include: this.defaultInclude(),
    });

    return {
      message: 'Property video uploaded successfully',
      property: this.mapProperty(updated),
    };
  }

  async removeVideo(propertyId: string, ownerId: string) {
    const property = await this.findOwnedEditableProperty(propertyId, ownerId);

    if (!property.videoUrl) {
      throw new NotFoundException('Property has no video');
    }

    await this.uploadService.deleteLocalFile(property.videoUrl);

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: { videoUrl: null },
      include: this.defaultInclude(),
    });

    return {
      message: 'Property video removed successfully',
      property: this.mapProperty(updated),
    };
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

  async adminFindAll(query: QueryOwnerPropertyDto, viewer?: PropertyViewer) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const categoryFilter = await this.categoryService.buildPropertyCategoryFilter(
      query,
    );

    const where: Prisma.PropertyWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...categoryFilter,
    };

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
      items.map((item) => this.mapProperty(item, viewer)),
      total,
      page,
      limit,
    );
  }

  async adminFindPending(query: QueryOwnerPropertyDto, viewer?: PropertyViewer) {
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
      items.map((item) => this.mapProperty(item, viewer)),
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

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PROPERTY_APPROVED, {
      ownerUserId: property.ownerId,
      propertyId: property.id,
      propertyTitle: property.title,
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

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PROPERTY_REJECTED, {
      ownerUserId: property.ownerId,
      propertyId: property.id,
      propertyTitle: property.title,
      reason,
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

  mapProperty(
    property: PropertyWithRelations & {
      owner?: { id: string; name: string; email?: string | null; phone?: string | null };
    },
    viewer?: PropertyViewer,
  ) {
    const appUrl = this.getAppUrl();
    const activeRental = property.rentals?.[0];

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price.toNumber(),
      pricePeriod: property.pricePeriod,
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
      parentCategoryId: property.category.parent?.id ?? property.category.parentId,
      parentCategory: property.category.parent
        ? {
            id: property.category.parent.id,
            name: property.category.parent.name,
            slug: property.category.parent.slug,
          }
        : null,
      subcategoryId: property.categoryId,
      subcategory: {
        id: property.category.id,
        name: property.category.name,
        slug: property.category.slug,
        parentId: property.category.parentId,
      },
      categoryId: property.categoryId,
      category: {
        id: property.category.id,
        name: property.category.name,
        slug: property.category.slug,
        parentId: property.category.parentId,
      },
      ownerId: property.ownerId,
      owner: property.owner ?? undefined,
      rejectionReason: property.rejectionReason,
      videoUrl: property.videoUrl
        ? this.uploadService.toPublicUrl(property.videoUrl, appUrl)
        : null,
      submittedAt: property.submittedAt,
      approvedAt: property.approvedAt,
      isNegotiable: property.isNegotiable,
      attributes: this.mapPropertyAttributes(property.attributeValues),
      rental: activeRental
        ? buildPropertyRentalPayload(activeRental, viewer, property)
        : undefined,
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

  private validatePricePeriod(
    purpose: PropertyPurpose,
    pricePeriod?: PricePeriod | null,
  ): void {
    if (purpose === PropertyPurpose.RENT) {
      if (!pricePeriod) {
        throw new BadRequestException(
          'pricePeriod is required for RENT properties (DAY, MONTH, or YEAR)',
        );
      }
      return;
    }

    if (pricePeriod) {
      throw new BadRequestException(
        'pricePeriod is only allowed for RENT properties',
      );
    }
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

  propertyInclude() {
    return this.defaultInclude();
  }

  private defaultInclude() {
    return {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
      images: { orderBy: { order: 'asc' as const } },
      rentals: {
        where: { status: RentalStatus.ACTIVE },
        take: 1,
        include: {
          tenant: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      attributeValues: {
        include: {
          attribute: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
        orderBy: { id: 'asc' as const },
      },
    };
  }

  private mapPropertyAttributes(
    values: PropertyWithRelations['attributeValues'],
  ) {
    if (!values?.length) {
      return { system: [], custom: [] };
    }

    return {
      system: values
        .filter((item) => item.attributeId && item.attribute)
        .map((item) => ({
          id: item.id,
          attributeId: item.attributeId,
          name: item.attribute!.name,
          slug: item.attribute!.slug,
          type: item.attribute!.type,
          value: item.value,
        })),
      custom: values
        .filter((item) => !item.attributeId)
        .map((item) => ({
          id: item.id,
          name: item.customName,
          type: item.customType,
          value: item.value,
        })),
    };
  }

  private resolveSubcategoryId(dto: {
    subcategoryId?: string;
    categoryId?: string;
  }): string | undefined {
    return dto.subcategoryId ?? dto.categoryId;
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
      pricePeriod:
        dto.purpose === PropertyPurpose.RENT ? dto.pricePeriod : null,
      status: PropertyStatus.DRAFT,
      isNegotiable: dto.isNegotiable ?? false,
      category: { connect: { id: dto.subcategoryId } },
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
      ...(dto.pricePeriod !== undefined ? { pricePeriod: dto.pricePeriod } : {}),
      ...(dto.purpose === PropertyPurpose.SALE ? { pricePeriod: null } : {}),
      ...(dto.isNegotiable !== undefined ? { isNegotiable: dto.isNegotiable } : {}),
      ...(this.resolveSubcategoryId(dto) !== undefined
        ? { category: { connect: { id: this.resolveSubcategoryId(dto) } } }
        : {}),
    };
  }

  private buildSimilarCriteria(input: {
    city: string;
    subcategoryId: string;
    bedrooms?: number;
    price: number;
    purpose?: PropertyPurpose;
    excludePropertyId?: string;
  }) {
    const priceMin = input.price * (1 - SIMILAR_PRICE_TOLERANCE_RATIO);
    const priceMax = input.price * (1 + SIMILAR_PRICE_TOLERANCE_RATIO);

    const bedroomsFilter =
      input.bedrooms !== undefined
        ? {
            min: Math.max(0, input.bedrooms - SIMILAR_BEDROOMS_DELTA),
            max: input.bedrooms + SIMILAR_BEDROOMS_DELTA,
          }
        : undefined;

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.APPROVED,
      city: { equals: input.city.trim(), mode: 'insensitive' },
      categoryId: input.subcategoryId,
      price: {
        gte: new Prisma.Decimal(priceMin),
        lte: new Prisma.Decimal(priceMax),
      },
      ...(input.purpose ? { purpose: input.purpose } : {}),
      ...(input.excludePropertyId ? { NOT: { id: input.excludePropertyId } } : {}),
      ...(bedroomsFilter
        ? {
            bedrooms: {
              gte: bedroomsFilter.min,
              lte: bedroomsFilter.max,
            },
          }
        : {}),
    };

    return {
      where,
      filters: {
        city: input.city.trim(),
        subcategoryId: input.subcategoryId,
        bedrooms: bedroomsFilter,
        price: {
          min: Math.round(priceMin * 100) / 100,
          max: Math.round(priceMax * 100) / 100,
        },
        purpose: input.purpose ?? null,
        excludePropertyId: input.excludePropertyId ?? null,
      },
    };
  }

  private async resolveSimilarSubcategoryId(
    subcategoryId?: string,
    type?: string,
  ): Promise<string> {
    if (subcategoryId) {
      await this.categoryService.assertLeafCategory(subcategoryId);
      return subcategoryId;
    }

    if (!type?.trim()) {
      throw new BadRequestException('subcategoryId or type is required');
    }

    const normalizedType = type.trim();
    const category = await this.prisma.category.findFirst({
      where: {
        parentId: { not: null },
        OR: [
          { slug: normalizedType.toLowerCase().replace(/\s+/g, '-') },
          { name: { equals: normalizedType, mode: 'insensitive' } },
          { slug: normalizedType.toLowerCase() },
        ],
      },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException(`Subcategory type "${type}" not found`);
    }

    return category.id;
  }
}

export { MAX_PROPERTY_IMAGES };
