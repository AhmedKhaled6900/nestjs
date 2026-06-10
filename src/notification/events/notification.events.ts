import { RoleName } from '@prisma/client';

export const NOTIFICATION_EVENTS = {
  USER_REGISTERED: 'notification.user.registered',
  USER_EMAIL_VERIFIED: 'notification.user.email_verified',
  OWNER_PROFILE_SUBMITTED: 'notification.owner.profile_submitted',
  OWNER_KYC_APPROVED: 'notification.owner.kyc_approved',
  OWNER_KYC_REJECTED: 'notification.owner.kyc_rejected',
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
