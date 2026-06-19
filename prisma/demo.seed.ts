import {
  AuthProvider,
  OwnerType,
  PricePeriod,
  PrismaClient,
  ProfileStatus,
  PropertyPurpose,
  PropertyStatus,
  RentalSource,
  RentalStatus,
  RoleName,
  ServiceLeadStatus,
  ServiceListingStatus,
  ServiceOrderStatus,
  ServiceProviderStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEMO_AREAS,
  DEMO_CITY,
  DEMO_CUSTOMERS,
  DEMO_OWNERS,
  DEMO_PASSWORD,
  DEMO_SERVICE_PROVIDERS,
  PLACEHOLDER_IMAGE,
} from './demo.seed-data';

type CreatedIds = {
  owners: Record<string, string>;
  customers: Record<string, string>;
  properties: Record<string, string>;
  providers: Record<string, string>;
  listings: Record<string, string>;
};

export async function seedDemoSite(prisma: PrismaClient) {
  if (process.env.SEED_DEMO === 'false') {
    console.log('SEED_DEMO=false — skipping demo site data.');
    return;
  }

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [ownerRole, customerRole, providerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.OWNER } }),
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.CUSTOMER } }),
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.SERVICE_PROVIDER } }),
  ]);

  const subcategories = await prisma.category.findMany({
    where: {
      slug: { in: ['chalet', 'apartment', 'villa'] },
    },
  });
  const categoryBySlug = new Map(subcategories.map((c) => [c.slug, c.id]));

  const chaletCat = categoryBySlug.get('chalet');
  const apartmentCat = categoryBySlug.get('apartment');
  const villaCat = categoryBySlug.get('villa');

  if (!chaletCat || !apartmentCat || !villaCat) {
    throw new Error('Run category seed before demo seed (chalet, apartment, villa).');
  }

  const serviceCategories = await prisma.serviceCategory.findMany();
  const serviceCatBySlug = new Map(serviceCategories.map((c) => [c.slug, c.id]));

  const ids: CreatedIds = {
    owners: {},
    customers: {},
    properties: {},
    providers: {},
    listings: {},
  };

  // ── Owners ──────────────────────────────────────────────────────────────
  for (const owner of DEMO_OWNERS) {
    const user = await prisma.user.create({
      data: {
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        password: hashedPassword,
        provider: AuthProvider.LOCAL,
        roleId: ownerRole.id,
        isVerified: true,
        ownerProfile: {
          create: {
            ownerType: owner.ownerType as OwnerType,
            companyName: owner.companyName,
            profileStatus: ProfileStatus.VERIFIED,
            phone: owner.phone,
            whatsapp: owner.phone,
            email: owner.email,
            city: owner.city,
            area: owner.area,
            bio: owner.bio,
            nationalId: PLACEHOLDER_IMAGE(`${owner.key}-kyc`),
          },
        },
      },
    });
    ids.owners[owner.key] = user.id;
  }

  const owner1 = ids.owners['owner-with-listings'];
  const owner2 = ids.owners['owner-more-listings'];
  const owner3 = ids.owners['owner-no-listings'];

  const now = new Date();
  const approvedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const propertyDefs = [
    {
      key: 'chalet-sidi',
      ownerId: owner1,
      categoryId: chaletCat,
      title: 'شاليه فاخر — سيدي بشر',
      description:
        'شاليه مكيف بالكامل على البحر مباشرة، 3 غرف، ريسепشن، مطبخ مجهز. مثالي للعائلات في المصيف.',
      price: 850,
      pricePeriod: PricePeriod.DAY,
      city: DEMO_CITY,
      area: DEMO_AREAS.sidiBeshr,
      address: 'شارع الكورniche، سيدي بشر',
      bedrooms: 3,
      bathrooms: 2,
      areaSize: 120,
      status: PropertyStatus.APPROVED,
      imageSeed: 'chalet-sidi',
    },
    {
      key: 'apt-agami',
      ownerId: owner1,
      categoryId: apartmentCat,
      title: 'شقة مفروشة — العجمي',
      description: 'شقة واسعة قريبة من الشاطئ، إيجار يومي أو أسبوعي. موقف سيارة متاح.',
      price: 500,
      pricePeriod: PricePeriod.DAY,
      city: DEMO_CITY,
      area: DEMO_AREAS.agami,
      address: 'طريق الإسكندرية — مطروح',
      bedrooms: 2,
      bathrooms: 1,
      areaSize: 90,
      status: PropertyStatus.APPROVED,
      imageSeed: 'apt-agami',
    },
    {
      key: 'villa-montaza',
      ownerId: owner2,
      categoryId: villaCat,
      title: 'فيلا بحديقة — المنتزه',
      description: 'فيلا مستقلة بحديقة وتراس، مناسبة للمجموعات الكبيرة.',
      price: 1200,
      pricePeriod: PricePeriod.DAY,
      city: DEMO_CITY,
      area: DEMO_AREAS.montaza,
      address: 'منطقة المنتزه',
      bedrooms: 4,
      bathrooms: 3,
      areaSize: 220,
      status: PropertyStatus.APPROVED,
      imageSeed: 'villa-montaza',
    },
    {
      key: 'chalet-matruh',
      ownerId: owner2,
      categoryId: chaletCat,
      title: 'شاليه — مرسى مطروح',
      description: 'شاليه هادئ في مرسى مطروح، قريب من الشاطئ.',
      price: 650,
      pricePeriod: PricePeriod.DAY,
      city: 'مرسى مطروح',
      area: DEMO_AREAS.marsaMatruh,
      address: 'شارع 25 يناير',
      bedrooms: 2,
      bathrooms: 1,
      areaSize: 75,
      status: PropertyStatus.APPROVED,
      imageSeed: 'chalet-matruh',
    },
    {
      key: 'apt-draft',
      ownerId: owner3,
      categoryId: apartmentCat,
      title: 'شقة مسودة — غير منشورة',
      description: 'مسودة — لن تظهر في الموقع.',
      price: 400,
      pricePeriod: PricePeriod.DAY,
      city: DEMO_CITY,
      area: DEMO_AREAS.montaza,
      address: 'مسودة',
      bedrooms: 1,
      bathrooms: 1,
      areaSize: 60,
      status: PropertyStatus.DRAFT,
      imageSeed: 'apt-draft',
    },
  ] as const;

  for (const def of propertyDefs) {
    const property = await prisma.property.create({
      data: {
        title: def.title,
        description: def.description,
        price: def.price,
        pricePeriod: def.pricePeriod,
        city: def.city,
        area: def.area,
        address: def.address,
        bedrooms: def.bedrooms,
        bathrooms: def.bathrooms,
        areaSize: def.areaSize,
        purpose: PropertyPurpose.RENT,
        status: def.status,
        categoryId: def.categoryId,
        ownerId: def.ownerId,
        isNegotiable: true,
        submittedAt: def.status !== PropertyStatus.DRAFT ? approvedAt : null,
        approvedAt: def.status === PropertyStatus.APPROVED ? approvedAt : null,
        images:
          def.status === PropertyStatus.APPROVED
            ? {
                create: [
                  {
                    imageUrl: PLACEHOLDER_IMAGE(def.imageSeed),
                    isPrimary: true,
                    order: 0,
                  },
                  {
                    imageUrl: PLACEHOLDER_IMAGE(`${def.imageSeed}-2`),
                    isPrimary: false,
                    order: 1,
                  },
                ],
              }
            : undefined,
      },
    });
    ids.properties[def.key] = property.id;
  }

  // ── Customers ───────────────────────────────────────────────────────────
  for (const customer of DEMO_CUSTOMERS) {
    const user = await prisma.user.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        password: hashedPassword,
        provider: AuthProvider.LOCAL,
        roleId: customerRole.id,
        isVerified: true,
      },
    });
    ids.customers[customer.key] = user.id;
  }

  const customer1 = ids.customers.customer1;
  const customer2 = ids.customers.customer2;
  const customer3 = ids.customers.customer3;

  // ── Bookings (PropertyRental) ───────────────────────────────────────────
  const bookingDefs = [
    {
      propertyKey: 'chalet-sidi',
      tenantId: customer1,
      duration: 5,
      notes: 'حجز أسبوع المصيف — عائلة',
    },
    {
      propertyKey: 'villa-montaza',
      tenantId: customer2,
      duration: 3,
      notes: 'رحلة نهاية الأسبوع',
    },
    {
      propertyKey: 'chalet-matruh',
      tenantId: customer3,
      duration: 7,
      notes: 'إجازة مطروح',
    },
  ] as const;

  for (const booking of bookingDefs) {
    const propertyId = ids.properties[booking.propertyKey];
    const property = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });

    const startedAt = new Date();
    const endsAt = new Date(startedAt);
    endsAt.setDate(endsAt.getDate() + booking.duration);

    await prisma.$transaction([
      prisma.propertyRental.create({
        data: {
          propertyId,
          tenantId: booking.tenantId,
          source: RentalSource.DIRECT_BOOKING,
          agreedPrice: property.price,
          pricePeriod: property.pricePeriod!,
          duration: booking.duration,
          startedAt,
          endsAt,
          status: RentalStatus.ACTIVE,
          notes: booking.notes,
        },
      }),
      prisma.property.update({
        where: { id: propertyId },
        data: { status: PropertyStatus.RENTED },
      }),
    ]);
  }

  // Favorite + review on available property
  const availablePropertyId = ids.properties['apt-agami'];
  await prisma.favorite.create({
    data: { userId: customer1, propertyId: availablePropertyId },
  });
  await prisma.propertyReview.create({
    data: {
      userId: customer2,
      propertyId: availablePropertyId,
      rating: 5,
      body: 'شقة ممتازة وقريبة من البحر — أنصح بها.',
    },
  });

  // ── Service providers ───────────────────────────────────────────────────
  for (const sp of DEMO_SERVICE_PROVIDERS) {
    const categoryId = serviceCatBySlug.get(sp.categorySlug);
    if (!categoryId) {
      throw new Error(`Service category not found: ${sp.categorySlug}`);
    }

    const user = await prisma.user.create({
      data: {
        name: sp.name,
        email: sp.email,
        phone: sp.phone,
        password: hashedPassword,
        provider: AuthProvider.LOCAL,
        roleId: providerRole.id,
        isVerified: true,
        serviceProviderProfile: {
          create: {
            businessName: sp.businessName,
            categoryId,
            description: sp.description,
            phone: sp.phone,
            whatsapp: sp.phone,
            logo: PLACEHOLDER_IMAGE(`provider-${sp.key}`),
            nationalId: PLACEHOLDER_IMAGE(`provider-kyc-${sp.key}`),
            status: sp.status as ServiceProviderStatus,
          },
        },
      },
      include: { serviceProviderProfile: true },
    });

    const profile = user.serviceProviderProfile!;
    ids.providers[sp.key] = profile.id;

    for (const cov of sp.coverage) {
      await prisma.serviceCoverageArea.create({
        data: {
          providerId: profile.id,
          city: cov.city,
          area: cov.area,
        },
      });
    }

    const listing = await prisma.serviceListing.create({
      data: {
        providerId: profile.id,
        categoryId,
        title: sp.listing.title,
        description: sp.description,
        menuItems: 'menuItems' in sp.listing ? sp.listing.menuItems : undefined,
        metadata: 'metadata' in sp.listing ? sp.listing.metadata : undefined,
        status: sp.listing.status as ServiceListingStatus,
      },
    });
    ids.listings[sp.key] = listing.id;
  }

  const restaurantProviderId = ids.providers.restaurant;
  const restaurantListingId = ids.listings.restaurant;
  const transportProviderId = ids.providers.transport;

  // ── Service orders (food) ───────────────────────────────────────────────
  const orderItems = [
    { name: 'سمك مشوي', quantity: 2, unitPrice: 120 },
    { name: 'أرز بحرية', quantity: 1, unitPrice: 45 },
  ];
  const subtotal = orderItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const deliveryFee = 20;
  const orderTotal = subtotal + deliveryFee;

  await prisma.serviceOrder.create({
    data: {
      customerId: customer1,
      providerId: restaurantProviderId,
      listingId: restaurantListingId,
      status: ServiceOrderStatus.DELIVERED,
      subtotal,
      deliveryFee,
      platformFee: 0,
      providerNet: orderTotal,
      deliveryCity: DEMO_CITY,
      deliveryArea: DEMO_AREAS.sidiBeshr,
      deliveryAddress: 'شارع 10، سيدي بشر',
      notes: 'بدون بصل',
      items: { create: orderItems },
    },
  });

  await prisma.serviceOrder.create({
    data: {
      customerId: customer2,
      providerId: restaurantProviderId,
      listingId: restaurantListingId,
      status: ServiceOrderStatus.PENDING,
      subtotal: 85,
      deliveryFee: 15,
      platformFee: 0,
      providerNet: 100,
      deliveryCity: DEMO_CITY,
      deliveryArea: DEMO_AREAS.sidiBeshr,
      deliveryAddress: 'شارع 5، سيدي بشر',
      items: {
        create: [{ name: 'سبيط مشوي', quantity: 1, unitPrice: 85 }],
      },
    },
  });

  // ── Service leads (transport) ─────────────────────────────────────────
  await prisma.serviceLead.create({
    data: {
      customerId: customer1,
      providerId: transportProviderId,
      type: 'microbus',
      pickupCity: DEMO_CITY,
      pickupArea: DEMO_AREAS.sidiBeshr,
      destination: DEMO_AREAS.marina,
      passengers: 6,
      preferredDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'رحلة للمارينا يوم الجمعة',
      status: ServiceLeadStatus.NEW,
    },
  });

  await prisma.serviceLead.create({
    data: {
      customerId: customer3,
      providerId: transportProviderId,
      type: 'microbus',
      pickupCity: DEMO_CITY,
      pickupArea: DEMO_AREAS.agami,
      destination: 'مطار برج العرب',
      passengers: 4,
      status: ServiceLeadStatus.CONTACTED,
    },
  });

  printDemoSummary();
}

function printDemoSummary() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  Demo site seeded — كل الحسابات كلمة المرور:');
  console.log(`  ${DEMO_PASSWORD}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('\n  Owners (بائعون):');
  console.log('    owner1@demo.aqar.com  — 2 إعلانات (1 متاح + 1 محجوز)');
  console.log('    owner2@demo.aqar.com  — 2 إعلانات (1 متاح + 1 محجوز)');
  console.log('    owner3@demo.aqar.com  — بدون إعلانات منشورة');
  console.log('\n  Customers (عملاء):');
  console.log('    customer1@demo.aqar.com — حجز شاليه سيدي بشر + طلب طعام');
  console.log('    customer2@demo.aqar.com — حجز فيلا المنتزه');
  console.log('    customer3@demo.aqar.com — حجز مطروح + lead نقل');
  console.log('\n  Service providers (على الموقع):');
  console.log('    provider1@demo.aqar.com — مطعم (APPROVED + منيو نشط)');
  console.log('    provider2@demo.aqar.com — كافيه (APPROVED + منيو نشط)');
  console.log('    provider3@demo.aqar.com — نقل (APPROVED + leads)');
  console.log('    provider4@demo.aqar.com — أسر منتجة (PENDING — لا يظهر)');
  console.log('\n  Available on catalog: شقة العجمي (APPROVED)');
  console.log('  Admin: from ADMIN_EMAIL in .env');
  console.log('══════════════════════════════════════════════════════\n');
}
