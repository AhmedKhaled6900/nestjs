/** Demo site seed — summer rental (المصيف) + service providers */

export const DEMO_PASSWORD =
  process.env.DEMO_PASSWORD ?? 'Demo@12345678';

export const DEMO_CITY = 'الإسكندرية';

export const DEMO_AREAS = {
  sidiBeshr: 'سيدي بشر',
  agami: 'العجمي',
  montaza: 'المنتزه',
  marsaMatruh: 'مرسى مطروح',
  marina: 'مارينا',
} as const;

export const PLACEHOLDER_IMAGE = (seed: string) =>
  `https://picsum.photos/seed/aqar-${seed}/800/600`;

export const DEMO_OWNERS = [
  {
    key: 'owner-with-listings',
    name: 'محمد حسن — مالك',
    email: 'owner1@demo.aqar.com',
    phone: '+201000000101',
    companyName: null as string | null,
    ownerType: 'INDIVIDUAL' as const,
    city: DEMO_CITY,
    area: DEMO_AREAS.sidiBeshr,
    bio: 'مالك شاليهات وشقق في سيدي بشر',
    withProperties: true,
  },
  {
    key: 'owner-more-listings',
    name: 'سارة إبراهيم — مالكة',
    email: 'owner2@demo.aqar.com',
    phone: '+201000000102',
    companyName: 'شركة الساحل للإيجار',
    ownerType: 'COMPANY' as const,
    city: DEMO_CITY,
    area: DEMO_AREAS.agami,
    bio: 'وحدات فاخرة في العجمي والمنتزه',
    withProperties: true,
  },
  {
    key: 'owner-no-listings',
    name: 'أحمد فتحي — مالك بدون إعلانات',
    email: 'owner3@demo.aqar.com',
    phone: '+201000000103',
    companyName: null,
    ownerType: 'INDIVIDUAL' as const,
    city: DEMO_CITY,
    area: DEMO_AREAS.montaza,
    bio: 'مسجل كمالك — لم ينشر عقارات بعد',
    withProperties: false,
  },
] as const;

export const DEMO_CUSTOMERS = [
  {
    key: 'customer1',
    name: 'ياسمين محمود',
    email: 'customer1@demo.aqar.com',
    phone: '+201000000201',
  },
  {
    key: 'customer2',
    name: 'كريم عبد الله',
    email: 'customer2@demo.aqar.com',
    phone: '+201000000202',
  },
  {
    key: 'customer3',
    name: 'نور الدين',
    email: 'customer3@demo.aqar.com',
    phone: '+201000000203',
  },
] as const;

export const DEMO_SERVICE_PROVIDERS = [
  {
    key: 'restaurant',
    name: 'مطعم البحر — مقدم',
    email: 'provider1@demo.aqar.com',
    phone: '+201000000301',
    businessName: 'مطعم البحر',
    categorySlug: 'restaurants',
    description: 'مأكولات بحرية وتوصيل سريع في سيدي بشر',
    status: 'APPROVED' as const,
    menuDeliveryFee: 15,
    coverage: [{ city: DEMO_CITY, area: DEMO_AREAS.sidiBeshr }],
    menu: [
      { name: 'سمك مشوي', price: 120, prepTimeMinutes: 25, sortOrder: 0 },
      { name: 'سبيط مشوي', price: 85, prepTimeMinutes: 20, sortOrder: 1 },
      { name: 'أرز بحرية', price: 45, prepTimeMinutes: 15, sortOrder: 2 },
    ],
    listing: {
      title: 'عرض الصيف — توصيل مجاني فوق 200 جنيه',
      status: 'ACTIVE' as const,
      deliveryFee: 10,
      image: PLACEHOLDER_IMAGE('listing-restaurant'),
      link: 'https://example.com/promo',
    },
  },
  {
    key: 'cafe',
    name: 'كافيه اللounge',
    email: 'provider2@demo.aqar.com',
    phone: '+201000000302',
    businessName: 'كافيه اللounge',
    categorySlug: 'cafes',
    description: 'قهوة ومشروبات ووجبات خفيفة',
    status: 'APPROVED' as const,
    menuDeliveryFee: 12,
    coverage: [{ city: DEMO_CITY, area: DEMO_AREAS.agami }],
    menu: [
      { name: 'لاتيه', price: 35, prepTimeMinutes: 8, sortOrder: 0 },
      { name: 'كروissant', price: 25, prepTimeMinutes: 5, sortOrder: 1 },
    ],
    listing: {
      title: 'خصم 10% على المشروبات الساخنة',
      status: 'ACTIVE' as const,
      deliveryFee: 8,
      image: PLACEHOLDER_IMAGE('listing-cafe'),
    },
  },
  {
    key: 'transport',
    name: 'نقل الساحل',
    email: 'provider3@demo.aqar.com',
    phone: '+201000000303',
    businessName: 'نقل الساحل',
    categorySlug: 'transport',
    description: 'ميكروباص وتوكتوك داخل الإسكندرية والساحل',
    status: 'APPROVED' as const,
    coverage: [{ city: DEMO_CITY, area: null }],
    listing: {
      title: 'خدمات النقل',
      status: 'ACTIVE' as const,
      image: PLACEHOLDER_IMAGE('listing-transport'),
      metadata: {
        vehicleTypes: ['microbus', 'toktok'],
        capacity: 14,
        approximatePrice: 150,
      },
    },
  },
  {
    key: 'home-cooking-pending',
    name: 'أسرة أم أحمد',
    email: 'provider4@demo.aqar.com',
    phone: '+201000000304',
    businessName: 'أسرة أم أحمد',
    categorySlug: 'home-cooking',
    description: 'وجبات منزلية — بانتظار الموافقة',
    status: 'PENDING' as const,
    menuDeliveryFee: 15,
    coverage: [{ city: DEMO_CITY, area: DEMO_AREAS.sidiBeshr }],
    menu: [{ name: 'محشي', price: 40, prepTimeMinutes: 45, sortOrder: 0 }],
    listing: {
      title: 'وجبات منزلية طازجة',
      status: 'DRAFT' as const,
    },
  },
] as const;
