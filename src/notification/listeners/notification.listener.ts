import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import {
  NOTIFICATION_EVENTS,
  OwnerKycApprovedEvent,
  OwnerKycRejectedEvent,
  OwnerProfileSubmittedEvent,
  UserEmailVerifiedEvent,
  UserRegisteredEvent,
} from '../events/notification.events';
import {
  buildOwnerKycApprovedNotification,
  buildOwnerKycRejectedNotification,
  buildOwnerProfileSubmittedNotification,
  buildUserEmailVerifiedNotification,
  buildUserRegisteredNotification,
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
}
