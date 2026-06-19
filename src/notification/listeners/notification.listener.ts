import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import {
  NOTIFICATION_EVENTS,
  OwnerKycApprovedEvent,
  OwnerKycRejectedEvent,
  OwnerProfileSubmittedEvent,
  PriceOfferAcceptedEvent,
  PriceOfferCounteredEvent,
  PriceOfferExpiredEvent,
  PriceOfferNegotiatingFailedEvent,
  PriceOfferReceivedEvent,
  PriceOfferRejectedEvent,
  PropertyApprovedEvent,
  PropertyRentedEvent,
  PropertyRejectedEvent,
  UserEmailVerifiedEvent,
  UserRegisteredEvent,
  ServiceProviderSubmittedEvent,
  ServiceProviderApprovedEvent,
  ServiceProviderRejectedEvent,
  ServiceProviderSuspendedEvent,
  ServiceOrderReceivedEvent,
  ServiceOrderAcceptedEvent,
  ServiceOrderRejectedEvent,
  ServiceOrderStatusUpdatedEvent,
  ServiceLeadReceivedEvent,
  ServiceLeadStatusUpdatedEvent,
  ProviderPromotionActivatedEvent,
} from '../events/notification.events';
import {
  buildOwnerKycApprovedNotification,
  buildOwnerKycRejectedNotification,
  buildOwnerProfileSubmittedNotification,
  buildPriceOfferAcceptedNotification,
  buildPriceOfferCounteredNotification,
  buildPriceOfferExpiredNotification,
  buildPriceOfferNegotiatingFailedNotification,
  buildPriceOfferReceivedNotification,
  buildPriceOfferRejectedNotification,
  buildPropertyApprovedNotification,
  buildPropertyRentedNotification,
  buildPropertyRejectedNotification,
  buildUserEmailVerifiedNotification,
  buildUserRegisteredNotification,
  buildServiceProviderSubmittedNotification,
  buildServiceProviderApprovedNotification,
  buildServiceProviderRejectedNotification,
  buildServiceProviderSuspendedNotification,
  buildServiceOrderReceivedNotification,
  buildServiceOrderAcceptedNotification,
  buildServiceOrderRejectedNotification,
  buildServiceOrderStatusUpdatedNotification,
  buildServiceLeadReceivedNotification,
  buildServiceLeadStatusUpdatedNotification,
  buildProviderPromotionActivatedNotification,
} from '../notification.templates';
import { NotificationService } from '../notification.service';

@Injectable()
export class NotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(NOTIFICATION_EVENTS.USER_REGISTERED, { async: true })
  async handleUserRegistered(payload: UserRegisteredEvent) {
    const content = buildUserRegisteredNotification(payload);

    await this.notificationService.createForAllAdmins({
      type: NotificationType.USER_REGISTERED,
      title: content.title,
      body: content.body,
      data: {
        actorUserId: payload.userId,
        role: payload.role,
        email: payload.email,
        phone: payload.phone,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.USER_EMAIL_VERIFIED, { async: true })
  async handleUserEmailVerified(payload: UserEmailVerifiedEvent) {
    const content = buildUserEmailVerifiedNotification(payload);

    await this.notificationService.createForAllAdmins({
      type: NotificationType.USER_EMAIL_VERIFIED,
      title: content.title,
      body: content.body,
      data: {
        actorUserId: payload.userId,
        role: payload.role,
        email: payload.email,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.OWNER_PROFILE_SUBMITTED, { async: true })
  async handleOwnerProfileSubmitted(payload: OwnerProfileSubmittedEvent) {
    const content = buildOwnerProfileSubmittedNotification(payload);

    await this.notificationService.createForAllAdmins({
      type: NotificationType.OWNER_PROFILE_SUBMITTED,
      title: content.title,
      body: content.body,
      data: {
        ownerUserId: payload.ownerUserId,
        profileId: payload.profileId,
        ownerType: payload.ownerType,
        profileStatus: payload.profileStatus,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.OWNER_KYC_APPROVED, { async: true })
  async handleOwnerKycApproved(payload: OwnerKycApprovedEvent) {
    const content = buildOwnerKycApprovedNotification(payload);

    await this.notificationService.create({
      userId: payload.ownerUserId,
      type: NotificationType.OWNER_KYC_APPROVED,
      title: content.title,
      body: content.body,
      data: { ownerUserId: payload.ownerUserId },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.OWNER_KYC_REJECTED, { async: true })
  async handleOwnerKycRejected(payload: OwnerKycRejectedEvent) {
    const content = buildOwnerKycRejectedNotification(payload);

    await this.notificationService.create({
      userId: payload.ownerUserId,
      type: NotificationType.OWNER_KYC_REJECTED,
      title: content.title,
      body: content.body,
      data: {
        ownerUserId: payload.ownerUserId,
        reason: payload.reason,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PROPERTY_APPROVED, { async: true })
  async handlePropertyApproved(payload: PropertyApprovedEvent) {
    const content = buildPropertyApprovedNotification(payload);

    await this.notificationService.create({
      userId: payload.ownerUserId,
      type: NotificationType.PROPERTY_APPROVED,
      title: content.title,
      body: content.body,
      data: {
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        action: 'APPROVED',
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PROPERTY_REJECTED, { async: true })
  async handlePropertyRejected(payload: PropertyRejectedEvent) {
    const content = buildPropertyRejectedNotification(payload);

    await this.notificationService.create({
      userId: payload.ownerUserId,
      type: NotificationType.PROPERTY_REJECTED,
      title: content.title,
      body: content.body,
      data: {
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        action: 'REJECTED',
        reason: payload.reason,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PROPERTY_RENTED, { async: true })
  async handlePropertyRented(payload: PropertyRentedEvent) {
    const content = buildPropertyRentedNotification(payload);

    await Promise.all([
      this.notificationService.create({
        userId: payload.ownerUserId,
        type: NotificationType.PROPERTY_RENTED,
        title: content.title,
        body: content.body,
        data: {
          rentalId: payload.rentalId,
          propertyId: payload.propertyId,
          propertyTitle: payload.propertyTitle,
          tenantId: payload.tenantId,
          agreedPrice: payload.agreedPrice,
          pricePeriod: payload.pricePeriod,
          duration: payload.duration,
          endsAt: payload.endsAt,
          source: payload.source,
        },
      }),
      this.notificationService.create({
        userId: payload.tenantId,
        type: NotificationType.PROPERTY_RENTED,
        title: content.title,
        body: content.body,
        data: {
          rentalId: payload.rentalId,
          propertyId: payload.propertyId,
          propertyTitle: payload.propertyTitle,
          agreedPrice: payload.agreedPrice,
          pricePeriod: payload.pricePeriod,
          duration: payload.duration,
          endsAt: payload.endsAt,
          source: payload.source,
        },
      }),
    ]);
  }

  @OnEvent(NOTIFICATION_EVENTS.PRICE_OFFER_RECEIVED, { async: true })
  async handlePriceOfferReceived(payload: PriceOfferReceivedEvent) {
    const content = buildPriceOfferReceivedNotification(payload);

    await this.notificationService.create({
      userId: payload.ownerUserId,
      type: NotificationType.PRICE_OFFER_RECEIVED,
      title: content.title,
      body: content.body,
      data: {
        offerId: payload.offerId,
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        customerId: payload.customerId,
        price: payload.price,
        pricePeriod: payload.pricePeriod,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PRICE_OFFER_ACCEPTED, { async: true })
  async handlePriceOfferAccepted(payload: PriceOfferAcceptedEvent) {
    const content = buildPriceOfferAcceptedNotification(payload);

    await this.notificationService.create({
      userId: payload.customerId,
      type: NotificationType.PRICE_OFFER_ACCEPTED,
      title: content.title,
      body: content.body,
      data: {
        offerId: payload.offerId,
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        price: payload.price,
        pricePeriod: payload.pricePeriod,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PRICE_OFFER_REJECTED, { async: true })
  async handlePriceOfferRejected(payload: PriceOfferRejectedEvent) {
    const content = buildPriceOfferRejectedNotification(payload);

    await this.notificationService.create({
      userId: payload.customerId,
      type: NotificationType.PRICE_OFFER_REJECTED,
      title: content.title,
      body: content.body,
      data: {
        offerId: payload.offerId,
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        reason: payload.reason,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PRICE_OFFER_COUNTERED, { async: true })
  async handlePriceOfferCountered(payload: PriceOfferCounteredEvent) {
    const content = buildPriceOfferCounteredNotification(payload);

    await this.notificationService.create({
      userId: payload.recipientUserId,
      type: NotificationType.PRICE_OFFER_COUNTERED,
      title: content.title,
      body: content.body,
      data: {
        offerId: payload.offerId,
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        senderRole: payload.senderRole,
        price: payload.price,
        pricePeriod: payload.pricePeriod,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PRICE_OFFER_EXPIRED, { async: true })
  async handlePriceOfferExpired(payload: PriceOfferExpiredEvent) {
    const content = buildPriceOfferExpiredNotification(payload);

    await Promise.all([
      this.notificationService.create({
        userId: payload.customerId,
        type: NotificationType.PRICE_OFFER_EXPIRED,
        title: content.title,
        body: content.body,
        data: {
          offerId: payload.offerId,
          propertyId: payload.propertyId,
          propertyTitle: payload.propertyTitle,
        },
      }),
      this.notificationService.create({
        userId: payload.ownerUserId,
        type: NotificationType.PRICE_OFFER_EXPIRED,
        title: content.title,
        body: content.body,
        data: {
          offerId: payload.offerId,
          propertyId: payload.propertyId,
          propertyTitle: payload.propertyTitle,
        },
      }),
    ]);
  }

  @OnEvent(NOTIFICATION_EVENTS.PRICE_OFFER_NEGOTIATING_FAILED, { async: true })
  async handlePriceOfferNegotiatingFailed(
    payload: PriceOfferNegotiatingFailedEvent,
  ) {
    const content = buildPriceOfferNegotiatingFailedNotification(payload);

    await Promise.all([
      this.notificationService.create({
        userId: payload.customerId,
        type: NotificationType.PRICE_OFFER_NEGOTIATING_FAILED,
        title: content.title,
        body: content.body,
        data: {
          offerId: payload.offerId,
          propertyId: payload.propertyId,
          propertyTitle: payload.propertyTitle,
        },
      }),
      this.notificationService.create({
        userId: payload.ownerUserId,
        type: NotificationType.PRICE_OFFER_NEGOTIATING_FAILED,
        title: content.title,
        body: content.body,
        data: {
          offerId: payload.offerId,
          propertyId: payload.propertyId,
          propertyTitle: payload.propertyTitle,
        },
      }),
    ]);
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_PROVIDER_SUBMITTED, { async: true })
  async handleServiceProviderSubmitted(payload: ServiceProviderSubmittedEvent) {
    const content = buildServiceProviderSubmittedNotification(payload);

    await this.notificationService.createForAllAdmins({
      type: NotificationType.SERVICE_PROVIDER_SUBMITTED,
      title: content.title,
      body: content.body,
      data: {
        providerUserId: payload.providerUserId,
        profileId: payload.profileId,
        businessName: payload.businessName,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_PROVIDER_APPROVED, { async: true })
  async handleServiceProviderApproved(payload: ServiceProviderApprovedEvent) {
    const content = buildServiceProviderApprovedNotification(payload);

    await this.notificationService.create({
      userId: payload.providerUserId,
      type: NotificationType.SERVICE_PROVIDER_APPROVED,
      title: content.title,
      body: content.body,
      data: { providerUserId: payload.providerUserId },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_PROVIDER_REJECTED, { async: true })
  async handleServiceProviderRejected(payload: ServiceProviderRejectedEvent) {
    const content = buildServiceProviderRejectedNotification(payload);

    await this.notificationService.create({
      userId: payload.providerUserId,
      type: NotificationType.SERVICE_PROVIDER_REJECTED,
      title: content.title,
      body: content.body,
      data: {
        providerUserId: payload.providerUserId,
        reason: payload.reason,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_PROVIDER_SUSPENDED, { async: true })
  async handleServiceProviderSuspended(payload: ServiceProviderSuspendedEvent) {
    const content = buildServiceProviderSuspendedNotification(payload);

    await this.notificationService.create({
      userId: payload.providerUserId,
      type: NotificationType.SERVICE_PROVIDER_SUSPENDED,
      title: content.title,
      body: content.body,
      data: {
        providerUserId: payload.providerUserId,
        reason: payload.reason,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_ORDER_RECEIVED, { async: true })
  async handleServiceOrderReceived(payload: ServiceOrderReceivedEvent) {
    const content = buildServiceOrderReceivedNotification(payload);

    await this.notificationService.create({
      userId: payload.providerUserId,
      type: NotificationType.SERVICE_ORDER_RECEIVED,
      title: content.title,
      body: content.body,
      data: {
        orderId: payload.orderId,
        customerId: payload.customerId,
        providerId: payload.providerId,
        listingTitle: payload.listingTitle,
        subtotal: payload.subtotal,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_ORDER_ACCEPTED, { async: true })
  async handleServiceOrderAccepted(payload: ServiceOrderAcceptedEvent) {
    const content = buildServiceOrderAcceptedNotification(payload);

    await this.notificationService.create({
      userId: payload.customerId,
      type: NotificationType.SERVICE_ORDER_ACCEPTED,
      title: content.title,
      body: content.body,
      data: {
        orderId: payload.orderId,
        listingTitle: payload.listingTitle,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_ORDER_REJECTED, { async: true })
  async handleServiceOrderRejected(payload: ServiceOrderRejectedEvent) {
    const content = buildServiceOrderRejectedNotification(payload);

    await this.notificationService.create({
      userId: payload.customerId,
      type: NotificationType.SERVICE_ORDER_REJECTED,
      title: content.title,
      body: content.body,
      data: {
        orderId: payload.orderId,
        listingTitle: payload.listingTitle,
        reason: payload.reason,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_ORDER_STATUS_UPDATED, { async: true })
  async handleServiceOrderStatusUpdated(payload: ServiceOrderStatusUpdatedEvent) {
    const content = buildServiceOrderStatusUpdatedNotification(payload);

    await this.notificationService.create({
      userId: payload.customerId,
      type: NotificationType.SERVICE_ORDER_STATUS_UPDATED,
      title: content.title,
      body: content.body,
      data: {
        orderId: payload.orderId,
        listingTitle: payload.listingTitle,
        status: payload.status,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_LEAD_RECEIVED, { async: true })
  async handleServiceLeadReceived(payload: ServiceLeadReceivedEvent) {
    const content = buildServiceLeadReceivedNotification(payload);

    await this.notificationService.create({
      userId: payload.providerUserId,
      type: NotificationType.SERVICE_LEAD_RECEIVED,
      title: content.title,
      body: content.body,
      data: {
        leadId: payload.leadId,
        customerId: payload.customerId,
        providerId: payload.providerId,
        destination: payload.destination,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SERVICE_LEAD_STATUS_UPDATED, { async: true })
  async handleServiceLeadStatusUpdated(payload: ServiceLeadStatusUpdatedEvent) {
    const content = buildServiceLeadStatusUpdatedNotification(payload);

    await this.notificationService.create({
      userId: payload.customerId,
      type: NotificationType.SERVICE_LEAD_STATUS_UPDATED,
      title: content.title,
      body: content.body,
      data: {
        leadId: payload.leadId,
        destination: payload.destination,
        status: payload.status,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PROVIDER_PROMOTION_ACTIVATED, { async: true })
  async handleProviderPromotionActivated(payload: ProviderPromotionActivatedEvent) {
    const content = buildProviderPromotionActivatedNotification(payload);

    await this.notificationService.create({
      userId: payload.providerUserId,
      type: NotificationType.PROVIDER_PROMOTION_ACTIVATED,
      title: content.title,
      body: content.body,
      data: {
        promotionId: payload.promotionId,
        type: payload.type,
      },
    });
  }
}
