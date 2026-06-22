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
  PROPERTY_RENTED: 'notification.property.rented',
  SERVICE_PROVIDER_SUBMITTED: 'notification.service_provider.submitted',
  SERVICE_PROVIDER_APPROVED: 'notification.service_provider.approved',
  SERVICE_PROVIDER_REJECTED: 'notification.service_provider.rejected',
  SERVICE_PROVIDER_SUSPENDED: 'notification.service_provider.suspended',
  SERVICE_LISTING_SUBMITTED: 'notification.service_listing.submitted',
  SERVICE_LISTING_APPROVED: 'notification.service_listing.approved',
  SERVICE_LISTING_REJECTED: 'notification.service_listing.rejected',
  SERVICE_ORDER_RECEIVED: 'notification.service_order.received',
  SERVICE_ORDER_ACCEPTED: 'notification.service_order.accepted',
  SERVICE_ORDER_REJECTED: 'notification.service_order.rejected',
  SERVICE_ORDER_STATUS_UPDATED: 'notification.service_order.status_updated',
  SERVICE_LEAD_RECEIVED: 'notification.service_lead.received',
  SERVICE_LEAD_STATUS_UPDATED: 'notification.service_lead.status_updated',
  PROVIDER_PROMOTION_ACTIVATED: 'notification.provider_promotion.activated',
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

export type PropertyRentedEvent = {
  ownerUserId: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyTitle: string;
  rentalId: string;
  agreedPrice: number;
  pricePeriod: string;
  duration: number;
  endsAt: string;
  source: string;
};

export type ServiceProviderSubmittedEvent = {
  providerUserId: string;
  providerName: string;
  providerEmail: string | null;
  profileId: string;
  businessName: string;
};

export type ServiceProviderApprovedEvent = {
  providerUserId: string;
  providerName: string;
  businessName: string;
};

export type ServiceProviderRejectedEvent = {
  providerUserId: string;
  providerName: string;
  reason: string;
};

export type ServiceProviderSuspendedEvent = {
  providerUserId: string;
  providerName: string;
  reason: string;
};

export type ServiceOrderReceivedEvent = {
  providerUserId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  orderId: string;
  orderSource: 'LISTING' | 'PROFILE_MENU';
  listingId: string | null;
  listingTitle: string;
  subtotal: number;
};

export type ServiceOrderAcceptedEvent = {
  customerId: string;
  orderId: string;
  listingTitle: string;
};

export type ServiceOrderRejectedEvent = {
  customerId: string;
  orderId: string;
  listingTitle: string;
  reason: string | null;
};

export type ServiceOrderStatusUpdatedEvent = {
  customerId: string;
  orderId: string;
  listingTitle: string;
  status: string;
};

export type ServiceLeadReceivedEvent = {
  providerUserId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  leadId: string;
  destination: string;
};

export type ServiceLeadStatusUpdatedEvent = {
  customerId: string;
  leadId: string;
  destination: string;
  status: string;
};

export type ProviderPromotionActivatedEvent = {
  providerUserId: string;
  promotionId: string;
  type: string;
};

export type ServiceListingSubmittedEvent = {
  listingId: string;
  listingTitle: string;
  providerId: string;
  providerUserId: string;
  businessName: string;
  providerName: string;
};

export type ServiceListingApprovedEvent = {
  providerUserId: string;
  listingId: string;
  listingTitle: string;
  businessName: string;
};

export type ServiceListingRejectedEvent = {
  providerUserId: string;
  listingId: string;
  listingTitle: string;
  reason: string;
};
