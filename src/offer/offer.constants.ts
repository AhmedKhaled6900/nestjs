import { OfferStatus } from '@prisma/client';

export const OFFER_EXPIRY_DAYS = 7;
export const MAX_OFFERS_PER_SIDE = 3;

export const ACTIVE_OFFER_STATUSES: OfferStatus[] = [
  OfferStatus.PENDING,
  OfferStatus.NEGOTIATING,
];

export const CLOSED_OFFER_STATUSES: OfferStatus[] = [
  OfferStatus.ACCEPTED,
  OfferStatus.REJECTED,
  OfferStatus.EXPIRED,
  OfferStatus.NEGOTIATING_FAIL,
];
