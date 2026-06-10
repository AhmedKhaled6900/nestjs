import {
  OwnerKycApprovedEvent,
  OwnerKycRejectedEvent,
  OwnerProfileSubmittedEvent,
  PropertyApprovedEvent,
  PropertyRejectedEvent,
  UserEmailVerifiedEvent,
  UserRegisteredEvent,
} from './events/notification.events';

type NotificationContent = {
  title: string;
  body: string;
};

export function buildUserRegisteredNotification(
  payload: UserRegisteredEvent,
): NotificationContent {
  return {
    title: 'تسجيل مستخدم جديد',
    body: `انضم ${payload.name} (${payload.role}) — ${payload.email ?? payload.phone ?? 'بدون بريد'}`,
  };
}

export function buildUserEmailVerifiedNotification(
  payload: UserEmailVerifiedEvent,
): NotificationContent {
  return {
    title: 'تفعيل بريد إلكتروني',
    body: `فعّل ${payload.name} (${payload.role}) بريده: ${payload.email ?? '—'}`,
  };
}

export function buildOwnerProfileSubmittedNotification(
  payload: OwnerProfileSubmittedEvent,
): NotificationContent {
  return {
    title: 'طلب مراجعة ملف مالك',
    body: `أرسل ${payload.ownerName} ملفه للمراجعة (${payload.ownerType ?? '—'})`,
  };
}

export function buildOwnerKycApprovedNotification(
  _payload: OwnerKycApprovedEvent,
): NotificationContent {
  return {
    title: 'تمت الموافقة على طلبك',
    body: 'وافق المسؤول على ملف المالك الخاص بك. يمكنك الآن إضافة العقارات.',
  };
}

export function buildOwnerKycRejectedNotification(
  payload: OwnerKycRejectedEvent,
): NotificationContent {
  return {
    title: 'تم رفض طلبك',
    body: `رفض المسؤول ملفك. السبب: ${payload.reason}`,
  };
}

export function buildPropertyApprovedNotification(
  payload: PropertyApprovedEvent,
): NotificationContent {
  return {
    title: 'تمت الموافقة على عقارك',
    body: `وافق المسؤول على عقارك «${payload.propertyTitle}» وهو الآن منشور على المنصة.`,
  };
}

export function buildPropertyRejectedNotification(
  payload: PropertyRejectedEvent,
): NotificationContent {
  return {
    title: 'تم رفض عقارك',
    body: `رفض المسؤول عقارك «${payload.propertyTitle}». السبب: ${payload.reason}`,
  };
}
