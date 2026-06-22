import { ServiceOrderStatus } from '@prisma/client';

export type ServiceOrderSource = 'LISTING' | 'PROFILE_MENU';

export const COMPLETED_ORDER_STATUSES: ServiceOrderStatus[] = [
  ServiceOrderStatus.DELIVERED,
];

export const ACTIVE_ORDER_STATUSES: ServiceOrderStatus[] = [
  ServiceOrderStatus.PENDING,
  ServiceOrderStatus.ACCEPTED,
  ServiceOrderStatus.PREPARING,
  ServiceOrderStatus.OUT_FOR_DELIVERY,
];

export interface ListingOrderStats {
  completedOrdersCount: number;
  activeOrdersCount: number;
}

export function resolveOrderSource(
  listingId: string | null | undefined,
): ServiceOrderSource {
  return listingId ? 'LISTING' : 'PROFILE_MENU';
}

export function buildOrderSourceMeta(
  listingId: string | null | undefined,
  listing?: { id: string; title: string } | null,
) {
  const orderSource = resolveOrderSource(listingId);

  return {
    orderSource,
    sourceLabel:
      orderSource === 'LISTING'
        ? (listing?.title ?? 'إعلان')
        : 'منيو البروفايل الرئيسي',
    listing: orderSource === 'LISTING' ? (listing ?? null) : null,
  };
}

export function createEmptyListingOrderStats(): ListingOrderStats {
  return { completedOrdersCount: 0, activeOrdersCount: 0 };
}

export function aggregateListingOrderStats(
  rows: Array<{
    listingId: string | null;
    status: ServiceOrderStatus;
    _count: { id: number };
  }>,
): Map<string, ListingOrderStats> {
  const map = new Map<string, ListingOrderStats>();

  for (const row of rows) {
    if (!row.listingId) {
      continue;
    }

    const current = map.get(row.listingId) ?? createEmptyListingOrderStats();

    if (COMPLETED_ORDER_STATUSES.includes(row.status)) {
      current.completedOrdersCount += row._count.id;
    } else if (ACTIVE_ORDER_STATUSES.includes(row.status)) {
      current.activeOrdersCount += row._count.id;
    }

    map.set(row.listingId, current);
  }

  return map;
}
