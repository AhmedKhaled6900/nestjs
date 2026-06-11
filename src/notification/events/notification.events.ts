import { RoleName } from '@prisma/client';

export const NOTIFICATION_EVENTS = {
  USER_REGISTERED: 'notification.user.registered',
  USER_EMAIL_VERIFIED: 'notification.user.email_verified',
  OWNER_PROFILE_SUBMITTED: 'notification.owner.profile_submitted',
  OWNER_KYC_APPROVED: 'notification.owner.kyc_approved',
  OWNER_KYC_REJECTED: 'notification.owner.kyc_rejected',
  PROPERTY_APPROVED: 'notification.property.approved',
  PROPERTY_REJECTED: 'notification.property.rejected',
  PRICE_OFFER_RECEIVED: 'notification.price_offer.received',
  PRICE_OFFER_ACCEPTED: 'notification.price_offer.accepted',
  PRICE_OFFER_REJECTED: 'notification.price_offer.rejected',
  PRICE_OFFER_COUNTERED: 'notification.price_offer.countered',
  PRICE_OFFER_EXPIRED: 'notification.price_offer.expired',
  PRICE_OFFER_NEGOTIATING_FAILED: 'notification.price_offer.negotiating_failed',
} as const;

export type UserRegisteredEvent = {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: RoleName;
};

export type UserEmailVerifiedEvent = {
  userId: string;
  name: string;
  email: string | null;
  role: RoleName;
};

export type OwnerProfileSubmittedEvent = {
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string | null;
  profileId: string;
  ownerType: string | null;
  profileStatus: string;
};

export type OwnerKycApprovedEvent = {
  ownerUserId: string;
  ownerName: string;
};

export type OwnerKycRejectedEvent = {
  ownerUserId: string;
  ownerName: string;
  reason: string;
};

export type PropertyApprovedEvent = {
  ownerUserId: string;
  propertyId: string;
  propertyTitle: string;
};

export type PropertyRejectedEvent = {
  ownerUserId: string;
  propertyId: string;
  propertyTitle: string;
  reason: string;
};

export type PriceOfferReceivedEvent = {
  ownerUserId: string;
  customerId: string;
  customerName: string;
  propertyId: string;
  propertyTitle: string;
  offerId: string;
  price: number;
  pricePeriod: string;
};

export type PriceOfferAcceptedEvent = {
  customerId: string;
  propertyId: string;
  propertyTitle: string;
  offerId: string;
  price: number;
  pricePeriod: string;
};

export type PriceOfferRejectedEvent = {
  customerId: string;
  propertyId: string;
  propertyTitle: string;
  offerId: string;
  reason: string | null;
};

export type PriceOfferCounteredEvent = {
  recipientUserId: string;
  senderRole: string;
  propertyId: string;
  propertyTitle: string;
  offerId: string;
  price: number;
  pricePeriod: string;
};

export type PriceOfferExpiredEvent = {
  customerId: string;
  ownerUserId: string;
  propertyId: string;
  propertyTitle: string;
  offerId: string;
};

export type PriceOfferNegotiatingFailedEvent = {
  customerId: string;
  ownerUserId: string;
  propertyId: string;
  propertyTitle: string;
  offerId: string;
};
