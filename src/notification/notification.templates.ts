import {
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

export function buildPriceOfferReceivedNotification(
  payload: PriceOfferReceivedEvent,
): NotificationContent {
  return {
    title: 'عرض سعر جديد',
    body: `قدّم ${payload.customerName} عرضًا على «${payload.propertyTitle}»: ${payload.price} / ${payload.pricePeriod}`,
  };
}

export function buildPriceOfferAcceptedNotification(
  payload: PriceOfferAcceptedEvent,
): NotificationContent {
  return {
    title: 'تم قبول عرضك',
    body: `وافق المالك على عرضك لـ «${payload.propertyTitle}» بسعر ${payload.price} / ${payload.pricePeriod}`,
  };
}

export function buildPriceOfferRejectedNotification(
  payload: PriceOfferRejectedEvent,
): NotificationContent {
  return {
    title: 'تم رفض عرضك',
    body: payload.reason
      ? `رفض المالك عرضك على «${payload.propertyTitle}». السبب: ${payload.reason}`
      : `رفض المالك عرضك على «${payload.propertyTitle}».`,
  };
}

export function buildPriceOfferCounteredNotification(
  payload: PriceOfferCounteredEvent,
): NotificationContent {
  const actor = payload.senderRole === 'OWNER' ? 'المالك' : 'العميل';
  return {
    title: 'عرض سعر مضاد',
    body: `قدّم ${actor} عرضًا مضادًا على «${payload.propertyTitle}»: ${payload.price} / ${payload.pricePeriod}`,
  };
}

export function buildPriceOfferExpiredNotification(
  payload: PriceOfferExpiredEvent,
): NotificationContent {
  return {
    title: 'انتهت صلاحية العرض',
    body: `انتهت صلاحية عرض السعر على «${payload.propertyTitle}» بعد 7 أيام دون رد.`,
  };
}

export function buildPriceOfferNegotiatingFailedNotification(
  payload: PriceOfferNegotiatingFailedEvent,
): NotificationContent {
  return {
    title: 'تعذّرت المفاوضة',
    body: `توقفت المفاوضة على «${payload.propertyTitle}» بعد الوصول للحد الأقصى من العروض (3 لكل طرف).`,
  };
}
