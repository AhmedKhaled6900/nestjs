import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  RoleName,
  ServiceProviderStatus,
  ServiceProviderProfile,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export async function getProviderProfileOrFail(
  prisma: PrismaService,
  userId: string,
): Promise<ServiceProviderProfile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { role: true, serviceProviderProfile: true },
  });

  if (user.role.name !== RoleName.SERVICE_PROVIDER) {
    throw new ForbiddenException('Only service providers can access this resource');
  }

  if (!user.serviceProviderProfile) {
    throw new NotFoundException('Service provider profile not found');
  }

  return user.serviceProviderProfile;
}

export function assertProviderApproved(profile: ServiceProviderProfile) {
  if (profile.status !== ServiceProviderStatus.APPROVED) {
    throw new ForbiddenException(
      'Provider profile must be approved before performing this action',
    );
  }
}

export function assertProviderCanManage(profile: ServiceProviderProfile) {
  if (
    profile.status !== ServiceProviderStatus.APPROVED &&
    profile.status !== ServiceProviderStatus.DRAFT &&
    profile.status !== ServiceProviderStatus.PENDING
  ) {
    throw new ForbiddenException('Provider account is suspended');
  }
}

export function decimalToNumber(value: { toNumber?: () => number } | number): number {
  if (typeof value === 'number') {
    return value;
  }
  return value.toNumber?.() ?? Number(value);
}

export function computeOrderFees(
  subtotal: number,
  deliveryFee: number,
  commissionRate: number,
) {
  const orderTotal = subtotal + deliveryFee;
  const platformFee = Math.round(orderTotal * commissionRate * 100) / 100;
  const providerNet = Math.round((orderTotal - platformFee) * 100) / 100;

  return { orderTotal, platformFee, providerNet };
}

export function parseDateRange(from?: string, to?: string) {
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  if (from && Number.isNaN(fromDate!.getTime())) {
    throw new BadRequestException('Invalid from date');
  }
  if (to && Number.isNaN(toDate!.getTime())) {
    throw new BadRequestException('Invalid to date');
  }

  return { fromDate, toDate };
}

/** Listing ad fee takes precedence; otherwise profile menu delivery fee. */
export function resolveOrderDeliveryFee(options: {
  listingDeliveryFee: number | null;
  profileMenuDeliveryFee: number;
}) {
  if (options.listingDeliveryFee !== null) {
    return options.listingDeliveryFee;
  }

  return options.profileMenuDeliveryFee;
}
