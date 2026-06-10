import { Injectable } from '@nestjs/common';
import { Prisma, ProfileStatus, RoleName } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryAdminCustomersDto,
  QueryAdminOwnersDto,
} from './dto/query-admin-users.dto';
import {
  EmailVerificationFilter,
  EmailVerificationStatus,
  ProfileCompletionFilter,
  ProfileCompletionStatus,
} from './enums/admin-user.enums';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(query: QueryAdminCustomersDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where: Prisma.UserWhereInput = {
      role: { name: RoleName.CUSTOMER },
      ...this.buildEmailVerificationFilter(query.emailVerification),
      ...this.buildCustomerProfileCompletionFilter(query.profileCompletion),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.customerSelect(),
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(
      users.map((user) => this.mapCustomer(user)),
      total,
      page,
      limit,
    );
  }

  async listOwners(query: QueryAdminOwnersDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const ownerProfileFilter = this.buildOwnerProfileFilter(query);

    const where: Prisma.UserWhereInput = {
      role: { name: RoleName.OWNER },
      ...this.buildEmailVerificationFilter(query.emailVerification),
      ...(ownerProfileFilter ? { ownerProfile: ownerProfileFilter } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ownerProfile: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(
      users.map((user) => this.mapOwner(user)),
      total,
      page,
      limit,
    );
  }

  private buildEmailVerificationFilter(
    filter?: EmailVerificationFilter,
  ): Prisma.UserWhereInput {
    if (filter === EmailVerificationFilter.VERIFIED) {
      return { isVerified: true };
    }

    if (filter === EmailVerificationFilter.NOT_VERIFIED) {
      return { isVerified: false };
    }

    return {};
  }

  private buildCustomerProfileCompletionFilter(
    filter?: ProfileCompletionFilter,
  ): Prisma.UserWhereInput {
    if (filter === ProfileCompletionFilter.COMPLETE) {
      return { isVerified: true };
    }

    if (filter === ProfileCompletionFilter.INCOMPLETE) {
      return { isVerified: false };
    }

    return {};
  }

  private buildOwnerProfileFilter(
    query: QueryAdminOwnersDto,
  ): Prisma.OwnerProfileWhereInput | undefined {
    const conditions: Prisma.OwnerProfileWhereInput[] = [];

    if (query.profileStatus) {
      conditions.push({ profileStatus: query.profileStatus });
    }

    if (query.profileCompletion === ProfileCompletionFilter.COMPLETE) {
      conditions.push({ profileStatus: { not: ProfileStatus.INCOMPLETE } });
    }

    if (query.profileCompletion === ProfileCompletionFilter.INCOMPLETE) {
      conditions.push({ profileStatus: ProfileStatus.INCOMPLETE });
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return { AND: conditions };
  }

  private customerSelect() {
    return {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      provider: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private mapCustomer(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    isVerified: boolean;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: RoleName.CUSTOMER,
      isVerified: user.isVerified,
      provider: user.provider,
      emailVerificationStatus: user.isVerified
        ? EmailVerificationStatus.VERIFIED
        : EmailVerificationStatus.NOT_VERIFIED,
      profileCompletionStatus: user.isVerified
        ? ProfileCompletionStatus.COMPLETE
        : ProfileCompletionStatus.INCOMPLETE,
      profileStatus: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapOwner(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    isVerified: boolean;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
    ownerProfile: {
      id: string;
      ownerType: string | null;
      profileStatus: ProfileStatus;
      companyName: string | null;
      city: string | null;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }) {
    const profileStatus = user.ownerProfile?.profileStatus ?? ProfileStatus.INCOMPLETE;
    const isProfileComplete = profileStatus !== ProfileStatus.INCOMPLETE;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: RoleName.OWNER,
      isVerified: user.isVerified,
      provider: user.provider,
      emailVerificationStatus: user.isVerified
        ? EmailVerificationStatus.VERIFIED
        : EmailVerificationStatus.NOT_VERIFIED,
      profileCompletionStatus: isProfileComplete
        ? ProfileCompletionStatus.COMPLETE
        : ProfileCompletionStatus.INCOMPLETE,
      profileStatus,
      ownerProfile: user.ownerProfile
        ? {
            id: user.ownerProfile.id,
            ownerType: user.ownerProfile.ownerType,
            companyName: user.ownerProfile.companyName,
            city: user.ownerProfile.city,
            profileStatus: user.ownerProfile.profileStatus,
            rejectionReason: user.ownerProfile.rejectionReason,
            createdAt: user.ownerProfile.createdAt,
            updatedAt: user.ownerProfile.updatedAt,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
