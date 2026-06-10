import { PrismaClient, RoleName, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CATEGORY_SEED } from './category.seed-data';
const prisma = new PrismaClient();

const PERMISSIONS = [
  { action: 'users.create', description: 'Create users' },
  { action: 'users.read', description: 'Read users' },
  { action: 'users.update', description: 'Update users' },
  { action: 'users.delete', description: 'Delete users' },
  { action: 'property.create', description: 'Create properties' },
  { action: 'property.update', description: 'Update properties' },
  { action: 'property.delete', description: 'Delete properties' },
  { action: 'property.publish', description: 'Submit properties for review' },
  { action: 'property.read', description: 'Read properties' },
  { action: 'property.review', description: 'Review property submissions' },
  { action: 'category.create', description: 'Create categories' },
  { action: 'category.update', description: 'Update categories' },
  { action: 'category.delete', description: 'Delete categories' },
  { action: 'category.read', description: 'Read all categories (admin)' },
  { action: 'booking.create', description: 'Create bookings' },
  { action: 'booking.cancel', description: 'Cancel bookings' },
  { action: 'booking.read', description: 'Read bookings' },
  { action: 'owner.profile.read', description: 'Read own owner profile' },
  { action: 'owner.profile.update', description: 'Update own owner profile' },
  { action: 'owner.review', description: 'Review owner KYC submissions' },
];

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.action),
  OWNER: [
    'property.create',
    'property.update',
    'property.delete',
    'property.publish',
    'property.read',
    'booking.read',
    'owner.profile.read',
    'owner.profile.update',
  ],
  CUSTOMER: ['property.read', 'booking.create', 'booking.cancel', 'booking.read'],
};

async function seedAdmin() {
  const seedAdmin = process.env.SEED_ADMIN === 'true';
  if (!seedAdmin) {
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN=true requires ADMIN_EMAIL and ADMIN_PASSWORD');
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMIN },
  });

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      name: 'System Admin',
      password: hashedPassword,
      roleId: adminRole.id,
      isVerified: true,
      provider: AuthProvider.LOCAL,
    },
    create: {
      name: 'System Admin',
      email: email.toLowerCase(),
      password: hashedPassword,
      roleId: adminRole.id,
      isVerified: true,
      provider: AuthProvider.LOCAL,
    },
  });

  console.log(`Admin user seeded: ${email}`);
}

async function seedCategories() {
  for (const main of CATEGORY_SEED) {
    const parent = await prisma.category.upsert({
      where: { slug: main.slug },
      update: {
        name: main.name,
        description: main.description,
        sortOrder: main.sortOrder,
        isActive: true,
        parentId: null,
      },
      create: {
        name: main.name,
        slug: main.slug,
        description: main.description,
        sortOrder: main.sortOrder,
        isActive: true,
      },
    });

    for (const child of main.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          sortOrder: child.sortOrder,
          isActive: true,
          parentId: parent.id,
        },
        create: {
          name: child.name,
          slug: child.slug,
          sortOrder: child.sortOrder,
          isActive: true,
          parentId: parent.id,
        },
      });
    }
  }

  console.log('Categories seeded: main categories and subcategories.');
}

async function main() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description },
      create: perm,
    });
  }

  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role`,
      },
    });

    const actions = ROLE_PERMISSIONS[roleName];
    for (const action of actions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { action },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  await seedCategories();
  await seedAdmin();

  console.log(
    'Seed completed: roles, permissions (including category.*), categories, and role-permission mappings.',
  );
  console.log('ADMIN role has all permissions:', PERMISSIONS.map((p) => p.action).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
