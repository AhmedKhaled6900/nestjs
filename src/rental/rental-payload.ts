import { RentalSource, RentalStatus } from '@prisma/client';
import { RoleName } from '@prisma/client';

export type PropertyViewer = { id: string; role: string };

export type RentalRecord = {
  id: string;
  tenantId: string;
  source: RentalSource;
  agreedPrice: { toNumber(): number };
  pricePeriod: string;
  duration: number;
  startedAt: Date;
  endsAt: Date;
  status: RentalStatus;
  notes: string | null;
  offerId: string | null;
  tenant: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
};

export function canViewRentalDetails(
  viewer: PropertyViewer | undefined,
  property: { ownerId: string },
  rental: { tenantId: string } | null | undefined,
): boolean {
  if (!viewer || !rental) {
    return false;
  }

  if (viewer.role === RoleName.ADMIN) {
    return true;
  }

  if (viewer.id === property.ownerId) {
    return true;
  }

  return viewer.id === rental.tenantId;
}

export function buildPropertyRentalPayload(
  rental: RentalRecord,
  viewer: PropertyViewer | undefined,
  property: { ownerId: string },
) {
  if (!canViewRentalDetails(viewer, property, rental)) {
    return undefined;
  }

  const isOwnerOrAdmin =
    viewer?.role === RoleName.ADMIN || viewer?.id === property.ownerId;

  return {
    id: rental.id,
    source: rental.source,
    agreedPrice: rental.agreedPrice.toNumber(),
    pricePeriod: rental.pricePeriod,
    duration: rental.duration,
    startedAt: rental.startedAt,
    endsAt: rental.endsAt,
    status: rental.status,
    notes: rental.notes,
    offerId: rental.offerId,
    ...(isOwnerOrAdmin
      ? {
          tenant: {
            id: rental.tenant.id,
            name: rental.tenant.name,
            email: rental.tenant.email,
            phone: rental.tenant.phone,
          },
        }
      : {}),
  };
}
