import {
  OwnerKycApprovedEvent,
  OwnerKycRejectedEvent,
  OwnerProfileSubmittedEvent,
  PriceOfferAcceptedEvent,
  PriceOfferCounteredEvent,
  PriceOfferExpiredEvent,
  PriceOfferNegotiatingFailedEvent,
  PriceOfferReceivedEvent,
  PropertyRentedEvent,
  PriceOfferRejectedEvent,
  PropertyApprovedEvent,
  PropertyRejectedEvent,
  UserEmailVerifiedEvent,
  UserRegisteredEvent,
  ServiceProviderSubmittedEvent,
  ServiceProviderApprovedEvent,
  ServiceProviderRejectedEvent,
  ServiceProviderSuspendedEvent,
  ServiceListingSubmittedEvent,
  ServiceListingApprovedEvent,
  ServiceListingRejectedEvent,
  ServiceOrderReceivedEvent,
  ServiceOrderAcceptedEvent,
  ServiceOrderRejectedEvent,
  ServiceOrderStatusUpdatedEvent,
  ServiceLeadReceivedEvent,
  ServiceLeadStatusUpdatedEvent,
  ProviderPromotionActivatedEvent,
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

export function buildPropertyRentedNotification(
  payload: PropertyRentedEvent,
): NotificationContent {
  return {
    title: 'تم تأجير الوحدة',
    body: `تم تأجير «${payload.propertyTitle}» — السعر المتفق ${payload.agreedPrice} / ${payload.pricePeriod} لمدة ${payload.duration} حتى ${payload.endsAt.slice(0, 10)}`,
  };
}

export function buildServiceProviderSubmittedNotification(
  payload: ServiceProviderSubmittedEvent,
): NotificationContent {
  return {
    title: 'طلب مراجعة مقدم خدمة',
    body: `أرسل ${payload.providerName} (${payload.businessName}) ملفه للمراجعة`,
  };
}

export function buildServiceProviderApprovedNotification(
  _payload: ServiceProviderApprovedEvent,
): NotificationContent {
  return {
    title: 'تمت الموافقة على حسابك',
    body: 'وافق المسؤول على ملف مقدم الخدمة. يمكنك الآن نشر الإعلانات واستقبال الطلبات.',
  };
}

export function buildServiceProviderRejectedNotification(
  payload: ServiceProviderRejectedEvent,
): NotificationContent {
  return {
    title: 'تم رفض طلبك',
    body: `رفض المسؤول ملف مقدم الخدمة. السبب: ${payload.reason}`,
  };
}

export function buildServiceProviderSuspendedNotification(
  payload: ServiceProviderSuspendedEvent,
): NotificationContent {
  return {
    title: 'تم تعليق حسابك',
    body: `علّق المسؤول حساب مقدم الخدمة. السبب: ${payload.reason}`,
  };
}

export function buildServiceListingSubmittedNotification(
  payload: ServiceListingSubmittedEvent,
): NotificationContent {
  return {
    title: 'إعلان بانتظار المراجعة',
    body: `أرسل ${payload.providerName} (${payload.businessName}) إعلان «${payload.listingTitle}» للمراجعة`,
  };
}

export function buildServiceListingApprovedNotification(
  payload: ServiceListingApprovedEvent,
): NotificationContent {
  return {
    title: 'تم نشر إعلانك',
    body: `وافق المسؤول على إعلان «${payload.listingTitle}» وهو الآن ظاهر للعملاء`,
  };
}

export function buildServiceListingRejectedNotification(
  payload: ServiceListingRejectedEvent,
): NotificationContent {
  return {
    title: 'تم رفض إعلانك',
    body: `رفض المسؤول إعلان «${payload.listingTitle}». السبب: ${payload.reason}`,
  };
}

export function buildServiceOrderReceivedNotification(
  payload: ServiceOrderReceivedEvent,
): NotificationContent {
  const sourceText =
    payload.orderSource === 'LISTING'
      ? `من إعلان «${payload.listingTitle}»`
      : 'من المنيو الرئيسي';

  return {
    title: 'طلب جديد',
    body: `طلب جديد ${sourceText} — ${payload.customerName} (${payload.subtotal})`,
  };
}

export function buildServiceOrderAcceptedNotification(
  payload: ServiceOrderAcceptedEvent,
): NotificationContent {
  return {
    title: 'تم قبول طلبك',
    body: `قبل مقدم الخدمة طلبك «${payload.listingTitle}»`,
  };
}

export function buildServiceOrderRejectedNotification(
  payload: ServiceOrderRejectedEvent,
): NotificationContent {
  return {
    title: 'تم رفض طلبك',
    body: payload.reason
      ? `رفض مقدم الخدمة طلب «${payload.listingTitle}». السبب: ${payload.reason}`
      : `رفض مقدم الخدمة طلب «${payload.listingTitle}»`,
  };
}

export function buildServiceOrderStatusUpdatedNotification(
  payload: ServiceOrderStatusUpdatedEvent,
): NotificationContent {
  return {
    title: 'تحديث حالة الطلب',
    body: `طلب «${payload.listingTitle}» — الحالة: ${payload.status}`,
  };
}

export function buildServiceLeadReceivedNotification(
  payload: ServiceLeadReceivedEvent,
): NotificationContent {
  return {
    title: 'طلب نقل جديد',
    body: `طلب نقل من ${payload.customerName} إلى ${payload.destination}`,
  };
}

export function buildServiceLeadStatusUpdatedNotification(
  payload: ServiceLeadStatusUpdatedEvent,
): NotificationContent {
  return {
    title: 'تحديث طلب النقل',
    body: `طلب النقل إلى ${payload.destination} — الحالة: ${payload.status}`,
  };
}

export function buildProviderPromotionActivatedNotification(
  payload: ProviderPromotionActivatedEvent,
): NotificationContent {
  return {
    title: 'تم تفعيل الإعلان المميز',
    body: `إعلانك المميز (${payload.type}) أصبح نشطاً على المنصة`,
  };
}
