import { seedDatabase } from './seed';
import { createScriptPrismaClient } from './prisma-script-client';

const prisma = createScriptPrismaClient();

export async function wipeDatabase() {
  await prisma.serviceOrderItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.serviceLead.deleteMany();
  await prisma.providerPromotion.deleteMany();
  await prisma.serviceListing.deleteMany();
  await prisma.serviceProviderMenuItem.deleteMany();
  await prisma.serviceCoverageArea.deleteMany();
  await prisma.serviceProviderProfile.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.propertyAttributeValue.deleteMany();
  await prisma.subcategoryAttribute.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.priceOfferRound.deleteMany();
  await prisma.propertyRental.deleteMany();
  await prisma.priceOffer.deleteMany();
  await prisma.propertyComment.deleteMany();
  await prisma.propertyReview.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.ownerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany({ where: { parentId: { not: null } } });
  await prisma.category.deleteMany({ where: { parentId: null } });

  console.log(
    'Database wiped: users, properties, services, engagement, offers, rentals, attributes, categories.',
  );
}

async function main() {
  if (process.env.RESET_DB !== 'true') {
    throw new Error(
      'Refusing to reset database. Set RESET_DB=true in your environment to confirm.',
    );
  }

  console.log('Resetting database...');
  await wipeDatabase();
  process.env.SEED_DEMO = process.env.SEED_DEMO ?? 'true';
  await seedDatabase();
  console.log('Reset completed.');
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
