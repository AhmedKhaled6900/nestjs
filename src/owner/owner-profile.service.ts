import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OwnerType, ProfileStatus, RoleName } from '@prisma/client';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { NOTIFICATION_EVENTS } from '../notification/events/notification.events';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompleteOwnerProfileDto,
  KycUploadedFiles,
} from './dto/owner-profile.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class OwnerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true, ownerProfile: true },
    });

    if (user.role.name !== RoleName.OWNER) {
      throw new ForbiddenException('Only owners can access owner profile');
    }

    if (!user.ownerProfile) {
      throw new NotFoundException('Owner profile not found');
    }

    return {
      ...this.mapProfile(user.ownerProfile),
      isVerified: user.isVerified,
    };
  }

  async completeProfile(
    userId: string,
    dto: CompleteOwnerProfileDto,
    files: KycUploadedFiles,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true, ownerProfile: true },
    });

    if (user.role.name !== RoleName.OWNER) {
      throw new ForbiddenException('Only owners can complete owner profile');
    }

    if (!user.ownerProfile) {
      throw new NotFoundException('Owner profile not found');
    }

    if (user.ownerProfile.profileStatus === ProfileStatus.VERIFIED) {
      throw new BadRequestException('Profile is already verified');
    }

    const documentUrls = await this.resolveDocumentUrls(
      userId,
      dto,
      files,
      user.ownerProfile,
    );

    const profile = await this.prisma.ownerProfile.update({
      where: { userId },
      data: {
        ownerType: dto.ownerType,
        companyName: dto.ownerType === OwnerType.COMPANY ? dto.companyName : null,
        taxNumber:
          dto.ownerType === OwnerType.COMPANY ? documentUrls.taxNumber : null,
        commercialRegister:
          dto.ownerType === OwnerType.COMPANY
            ? documentUrls.commercialRegister
            : null,
        nationalId:
          dto.ownerType === OwnerType.INDIVIDUAL
            ? documentUrls.nationalId
            : null,
        whatsapp: dto.whatsapp,
        phone: dto.phone,
        email: dto.email?.toLowerCase(),
        address: dto.address,
        city: dto.city,
        area: dto.area,
        bio: dto.bio,
        profileStatus: ProfileStatus.KYC_PENDING,
        rejectionReason: null,
      },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.OWNER_PROFILE_SUBMITTED, {
      ownerUserId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      profileId: profile.id,
      ownerType: profile.ownerType,
      profileStatus: profile.profileStatus,
    });

    return {
      message: 'Profile submitted for admin review',
      profile: this.mapProfile(profile),
    };
  }

  async listPendingProfiles(query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = {
      OR: [
        { profileStatus: ProfileStatus.KYC_PENDING },
        { user: { isVerified: false } },
      ],
    };

    const [profiles, total] = await Promise.all([
      this.prisma.ownerProfile.findMany({
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
        },
        orderBy: [{ user: { isVerified: 'asc' } }, { updatedAt: 'desc' }],
      }),
      this.prisma.ownerProfile.count({ where }),
    ]);

    return buildPaginatedResult(
      profiles.map((profile) => ({
        ...this.mapProfile(profile),
        isVerified: profile.user.isVerified,
        pendingType: !profile.user.isVerified
          ? 'EMAIL_NOT_VERIFIED'
          : 'KYC_REVIEW',
        user: profile.user,
      })),
      total,
      page,
      limit,
    );
  }

  async approveProfile(userId: string) {
    const profile = await this.findProfileOrFail(userId);

    if (profile.profileStatus !== ProfileStatus.KYC_PENDING) {
      throw new BadRequestException('Only pending profiles can be approved');
    }

    const updated = await this.prisma.ownerProfile.update({
      where: { userId },
      data: {
        profileStatus: ProfileStatus.VERIFIED,
        rejectionReason: null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.OWNER_KYC_APPROVED, {
      ownerUserId: updated.user.id,
      ownerName: updated.user.name,
    });

    return {
      message: 'Owner profile approved',
      profile: this.mapProfile(updated),
    };
  }

  async rejectProfile(userId: string, reason: string) {
    const profile = await this.findProfileOrFail(userId);

    if (profile.profileStatus !== ProfileStatus.KYC_PENDING) {
      throw new BadRequestException('Only pending profiles can be rejected');
    }

    const updated = await this.prisma.ownerProfile.update({
      where: { userId },
      data: {
        profileStatus: ProfileStatus.REJECTED,
        rejectionReason: reason,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.OWNER_KYC_REJECTED, {
      ownerUserId: updated.user.id,
      ownerName: updated.user.name,
      reason,
    });

    return {
      message: 'Owner profile rejected',
      profile: this.mapProfile(updated),
    };
  }

  private async findProfileOrFail(userId: string) {
    const profile = await this.prisma.ownerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Owner profile not found');
    }

    return profile;
  }

  private async resolveDocumentUrls(
    userId: string,
    dto: CompleteOwnerProfileDto,
    files: KycUploadedFiles,
    existingProfile: {
      nationalId: string | null;
      taxNumber: string | null;
      commercialRegister: string | null;
    },
  ) {
    if (dto.ownerType === OwnerType.COMPANY) {
      if (!dto.companyName) {
        throw new BadRequestException('companyName is required for COMPANY');
      }

      const taxNumberFile = files.taxNumber?.[0];
      const commercialRegisterFile = files.commercialRegister?.[0];

      const taxNumber = await this.resolveDocumentUrl(
        taxNumberFile,
        existingProfile.taxNumber,
        userId,
        'taxNumber',
        'taxNumber image is required for COMPANY',
      );
      const commercialRegister = await this.resolveDocumentUrl(
        commercialRegisterFile,
        existingProfile.commercialRegister,
        userId,
        'commercialRegister',
        'commercialRegister image is required for COMPANY',
      );

      if (taxNumberFile) {
        await this.uploadService.deleteLocalFile(existingProfile.taxNumber);
      }
      if (commercialRegisterFile) {
        await this.uploadService.deleteLocalFile(
          existingProfile.commercialRegister,
        );
      }
      if (taxNumberFile || commercialRegisterFile) {
        await this.uploadService.deleteLocalFile(existingProfile.nationalId);
      }

      return {
        taxNumber,
        commercialRegister,
        nationalId: null as string | null,
      };
    }

    if (dto.ownerType === OwnerType.INDIVIDUAL) {
      const nationalIdFile = files.nationalId?.[0];

      const nationalId = await this.resolveDocumentUrl(
        nationalIdFile,
        existingProfile.nationalId,
        userId,
        'nationalId',
        'nationalId image is required for INDIVIDUAL',
      );

      if (nationalIdFile) {
        await this.uploadService.deleteLocalFile(existingProfile.nationalId);
        await this.uploadService.deleteLocalFile(existingProfile.taxNumber);
        await this.uploadService.deleteLocalFile(
          existingProfile.commercialRegister,
        );
      }

      return {
        nationalId,
        taxNumber: null as string | null,
        commercialRegister: null as string | null,
      };
    }

    throw new BadRequestException('Invalid ownerType');
  }

  private async resolveDocumentUrl(
    file: Express.Multer.File | undefined,
    existingValue: string | null,
    userId: string,
    fieldName: string,
    requiredMessage: string,
  ): Promise<string> {
    if (file) {
      return this.uploadService.saveKycImage(file, userId, fieldName);
    }

    if (existingValue?.startsWith('/uploads/')) {
      return existingValue;
    }

    throw new BadRequestException(requiredMessage);
  }

  private toPublicDocumentUrl(storedValue: string | null): string | null {
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

  private mapProfile(profile: {
    id: string;
    userId: string;
    ownerType: OwnerType | null;
    companyName: string | null;
    taxNumber: string | null;
    commercialRegister: string | null;
    nationalId: string | null;
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    area: string | null;
    bio: string | null;
    profileStatus: ProfileStatus;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: profile.id,
      userId: profile.userId,
      ownerType: profile.ownerType,
      companyName: profile.companyName,
      nationalId: this.toPublicDocumentUrl(profile.nationalId),
      taxNumber: this.toPublicDocumentUrl(profile.taxNumber),
      commercialRegister: this.toPublicDocumentUrl(profile.commercialRegister),
      whatsapp: profile.whatsapp,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      city: profile.city,
      area: profile.area,
      bio: profile.bio,
      profileStatus: profile.profileStatus,
      rejectionReason: profile.rejectionReason,
      isProfileComplete: profile.profileStatus !== ProfileStatus.INCOMPLETE,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
