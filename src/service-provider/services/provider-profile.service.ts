import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoleName, ServiceProviderStatus } from '@prisma/client';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../../common/dto/pagination.dto';
import { NOTIFICATION_EVENTS } from '../../notification/events/notification.events';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import {
  CreateProviderProfileDto,
  ProviderKycUploadedFiles,
  SubmitProviderProfileDto,
  UpdateProviderProfileDto,
} from '../dto/provider-profile.dto';
import { getProviderProfileOrFail, decimalToNumber } from '../helpers/provider.helpers';

@Injectable()
export class ProviderProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMyProfile(userId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    return this.mapProfileWithRelations(profile.id);
  }

  async createProfile(userId: string, dto: CreateProviderProfileDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true, serviceProviderProfile: true },
    });

    if (user.role.name !== RoleName.SERVICE_PROVIDER) {
      throw new ForbiddenException('Only service providers can create a profile');
    }

    if (user.serviceProviderProfile) {
      throw new BadRequestException('Service provider profile already exists');
    }

    await this.assertCategoryExists(dto.categoryId);

    const profile = await this.prisma.serviceProviderProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        categoryId: dto.categoryId,
        description: dto.description,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        menuDeliveryFee: dto.menuDeliveryFee ?? 0,
        status: ServiceProviderStatus.DRAFT,
      },
    });

    return {
      message: 'Provider profile created',
      profile: await this.mapProfileWithRelations(profile.id),
    };
  }

  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    if (profile.status === ServiceProviderStatus.SUSPENDED) {
      throw new ForbiddenException('Suspended providers cannot update profile');
    }

    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    await this.prisma.serviceProviderProfile.update({
      where: { id: profile.id },
      data: {
        businessName: dto.businessName,
        categoryId: dto.categoryId,
        description: dto.description,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        menuDeliveryFee: dto.menuDeliveryFee,
      },
    });

    return {
      message: 'Provider profile updated',
      profile: await this.mapProfileWithRelations(profile.id),
    };
  }

  async updateLogo(userId: string, logoFile: Express.Multer.File) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    if (profile.status === ServiceProviderStatus.SUSPENDED) {
      throw new ForbiddenException('Suspended providers cannot update profile');
    }

    if (!logoFile) {
      throw new BadRequestException('Logo image is required');
    }

    await this.uploadService.deleteLocalFile(profile.logo);
    const logo = await this.uploadService.saveKycImage(
      logoFile,
      userId,
      'providerLogo',
    );

    await this.prisma.serviceProviderProfile.update({
      where: { id: profile.id },
      data: { logo },
    });

    return {
      message: 'Provider logo updated',
      profile: await this.mapProfileWithRelations(profile.id),
    };
  }

  async submitForReview(
    userId: string,
    dto: SubmitProviderProfileDto,
    files: ProviderKycUploadedFiles,
  ) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    if (profile.status === ServiceProviderStatus.APPROVED) {
      throw new BadRequestException('Profile is already approved');
    }

    if (profile.status === ServiceProviderStatus.SUSPENDED) {
      throw new ForbiddenException('Suspended providers cannot submit profile');
    }

    const logoFile = files.logo?.[0];
    const nationalIdFile = files.nationalId?.[0];
    const commercialRegisterFile = files.commercialRegister?.[0];

    let logo = profile.logo;
    let nationalId = profile.nationalId;
    let commercialRegister = profile.commercialRegister;

    if (logoFile) {
      await this.uploadService.deleteLocalFile(profile.logo);
      logo = await this.uploadService.saveKycImage(logoFile, userId, 'providerLogo');
    }

    if (nationalIdFile) {
      await this.uploadService.deleteLocalFile(profile.nationalId);
      nationalId = await this.uploadService.saveKycImage(
        nationalIdFile,
        userId,
        'providerNationalId',
      );
    } else if (dto.nationalId) {
      nationalId = dto.nationalId;
    }

    if (commercialRegisterFile) {
      await this.uploadService.deleteLocalFile(profile.commercialRegister);
      commercialRegister = await this.uploadService.saveKycImage(
        commercialRegisterFile,
        userId,
        'providerCommercialRegister',
      );
    } else if (dto.commercialRegister) {
      commercialRegister = dto.commercialRegister;
    }

    if (!nationalId && !commercialRegister) {
      throw new BadRequestException(
        'At least one KYC document (nationalId or commercialRegister) is required',
      );
    }

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { id: profile.id },
      data: {
        logo,
        nationalId,
        commercialRegister,
        status: ServiceProviderStatus.PENDING,
        rejectionReason: null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_PROVIDER_SUBMITTED, {
      providerUserId: updated.user.id,
      providerName: updated.user.name,
      providerEmail: updated.user.email,
      profileId: updated.id,
      businessName: updated.businessName,
    });

    return {
      message: 'Profile submitted for admin review',
      profile: await this.mapProfileWithRelations(updated.id),
    };
  }

  async listPendingProfiles(query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = { status: ServiceProviderStatus.PENDING };

    const [profiles, total] = await Promise.all([
      this.prisma.serviceProviderProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isVerified: true,
              createdAt: true,
            },
          },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.serviceProviderProfile.count({ where }),
    ]);

    return buildPaginatedResult(
      profiles.map((p) => ({
        ...this.mapProfile(p),
        user: p.user,
        category: p.category,
      })),
      total,
      page,
      limit,
    );
  }

  async approveProfile(userId: string) {
    const profile = await this.findProfileByUserIdOrFail(userId);

    if (profile.status !== ServiceProviderStatus.PENDING) {
      throw new BadRequestException('Only pending profiles can be approved');
    }

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { userId },
      data: {
        status: ServiceProviderStatus.APPROVED,
        rejectionReason: null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_PROVIDER_APPROVED, {
      providerUserId: updated.user.id,
      providerName: updated.user.name,
      businessName: updated.businessName,
    });

    return {
      message: 'Service provider approved',
      profile: this.mapProfile(updated),
    };
  }

  async rejectProfile(userId: string, reason: string) {
    const profile = await this.findProfileByUserIdOrFail(userId);

    if (profile.status !== ServiceProviderStatus.PENDING) {
      throw new BadRequestException('Only pending profiles can be rejected');
    }

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { userId },
      data: {
        status: ServiceProviderStatus.DRAFT,
        rejectionReason: reason,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_PROVIDER_REJECTED, {
      providerUserId: updated.user.id,
      providerName: updated.user.name,
      reason,
    });

    return {
      message: 'Service provider rejected',
      profile: this.mapProfile(updated),
    };
  }

  async suspendProfile(userId: string, reason: string) {
    const profile = await this.findProfileByUserIdOrFail(userId);

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { userId },
      data: {
        status: ServiceProviderStatus.SUSPENDED,
        suspensionReason: reason,
        suspendedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_PROVIDER_SUSPENDED, {
      providerUserId: updated.user.id,
      providerName: updated.user.name,
      reason,
    });

    return {
      message: 'Service provider suspended',
      profile: this.mapProfile(updated),
    };
  }

  private async findProfileByUserIdOrFail(userId: string) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Service provider profile not found');
    }

    return profile;
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      throw new BadRequestException('Invalid or inactive service category');
    }
  }

  private async mapProfileWithRelations(profileId: string) {
    const profile = await this.prisma.serviceProviderProfile.findUniqueOrThrow({
      where: { id: profileId },
      include: {
        category: { select: { id: true, name: true, slug: true, commissionRate: true } },
        coverageAreas: { where: { isActive: true }, orderBy: { city: 'asc' } },
        _count: { select: { listings: true, orders: true, leads: true } },
      },
    });

    return {
      ...this.mapProfile(profile),
      category: {
        ...profile.category,
        commissionRate: Number(profile.category.commissionRate),
      },
      coverageAreas: profile.coverageAreas,
      counts: profile._count,
    };
  }

  private mapProfile(profile: {
    id: string;
    userId: string;
    businessName: string;
    categoryId: string;
    description: string | null;
    logo: string | null;
    phone: string | null;
    whatsapp: string | null;
    nationalId: string | null;
    commercialRegister: string | null;
    menuDeliveryFee: { toNumber?: () => number } | number;
    status: ServiceProviderStatus;
    rejectionReason: string | null;
    suspensionReason: string | null;
    suspendedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      categoryId: profile.categoryId,
      description: profile.description,
      logo: this.toPublicUrl(profile.logo),
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      nationalId: this.toPublicUrl(profile.nationalId),
      commercialRegister: this.toPublicUrl(profile.commercialRegister),
      menuDeliveryFee: decimalToNumber(profile.menuDeliveryFee),
      status: profile.status,
      rejectionReason: profile.rejectionReason,
      suspensionReason: profile.suspensionReason,
      suspendedAt: profile.suspendedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private toPublicUrl(storedValue: string | null): string | null {
    if (!storedValue) {
      return null;
    }

    if (storedValue.startsWith('http://') || storedValue.startsWith('https://')) {
      return storedValue;
    }

    if (storedValue.startsWith('/uploads/')) {
      const appUrl = this.configService
        .get<string>('APP_URL', 'http://localhost:3000')
        .replace(/\/$/, '');
      return `${appUrl}${storedValue}`;
    }

    return null;
  }
}
