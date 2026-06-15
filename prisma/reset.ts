import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed';

const prisma = new PrismaClient();

export async function wipeDatabase() {
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

  console.log('Database wiped: users, properties, engagement, offers, rentals, attributes, categories.');
}

async function main() {
  if (process.env.RESET_DB !== 'true') {
    throw new Error(
      'Refusing to reset database. Set RESET_DB=true in your environment to confirm.',
    );
  }

  console.log('Resetting database...');
  await wipeDatabase();
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
