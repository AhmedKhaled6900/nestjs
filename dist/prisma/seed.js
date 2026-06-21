"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const category_seed_data_1 = require("./category.seed-data");
const service_category_seed_data_1 = require("./service-category.seed-data");
const demo_seed_1 = require("./demo.seed");
const prisma = new client_1.PrismaClient();
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
    { action: 'favorite.create', description: 'Add properties to favorites' },
    { action: 'favorite.read', description: 'List my favorites' },
    { action: 'favorite.delete', description: 'Remove from favorites' },
    { action: 'cart.create', description: 'Add properties to cart' },
    { action: 'cart.read', description: 'List my cart' },
    { action: 'cart.delete', description: 'Remove from cart' },
    { action: 'review.create', description: 'Create property reviews' },
    { action: 'review.read', description: 'Read property reviews' },
    { action: 'review.update', description: 'Update own reviews' },
    { action: 'review.delete', description: 'Delete own reviews' },
    { action: 'comment.create', description: 'Create property comments' },
    { action: 'comment.read', description: 'Read property comments' },
    { action: 'comment.update', description: 'Update own comments' },
    { action: 'comment.delete', description: 'Delete own comments' },
    { action: 'offer.create', description: 'Submit price offers' },
    { action: 'offer.read', description: 'Read price offers' },
    { action: 'offer.respond', description: 'Accept, reject, or counter offers (owner)' },
    { action: 'offer.counter', description: 'Counter an offer (customer)' },
    { action: 'attribute.create', description: 'Create attribute definitions' },
    { action: 'attribute.read', description: 'Read attribute definitions' },
    { action: 'attribute.update', description: 'Update attribute definitions and subcategory links' },
    { action: 'attribute.delete', description: 'Delete attribute definitions' },
    { action: 'provider.profile.read', description: 'Read own service provider profile' },
    { action: 'provider.profile.update', description: 'Update own service provider profile' },
    { action: 'provider.coverage.manage', description: 'Manage service coverage areas' },
    { action: 'provider.listing.manage', description: 'Manage service listings' },
    { action: 'provider.menu.manage', description: 'Manage provider profile menu' },
    { action: 'provider.order.read', description: 'Read provider orders' },
    { action: 'provider.order.manage', description: 'Accept/reject/update provider orders' },
    { action: 'provider.lead.read', description: 'Read provider leads' },
    { action: 'provider.lead.manage', description: 'Update provider lead status' },
    { action: 'provider.dashboard.read', description: 'Read provider dashboard stats' },
    { action: 'provider.promotion.manage', description: 'Manage paid provider promotions' },
    { action: 'service.read', description: 'Browse service providers and listings' },
    { action: 'service.order.create', description: 'Place food service orders' },
    { action: 'service.order.read', description: 'Read own service orders' },
    { action: 'service.lead.create', description: 'Submit transport service leads' },
    { action: 'service.lead.read', description: 'Read own service leads' },
    { action: 'provider.review', description: 'Review and approve service providers' },
    { action: 'service.category.read', description: 'Read service categories (admin)' },
    { action: 'service.category.manage', description: 'Manage service categories and commission rates' },
];
const ROLE_PERMISSIONS = {
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
        'offer.read',
        'offer.respond',
    ],
    CUSTOMER: [
        'property.read',
        'booking.create',
        'booking.cancel',
        'booking.read',
        'favorite.create',
        'favorite.read',
        'favorite.delete',
        'cart.create',
        'cart.read',
        'cart.delete',
        'review.create',
        'review.read',
        'review.update',
        'review.delete',
        'comment.create',
        'comment.read',
        'comment.update',
        'comment.delete',
        'offer.create',
        'offer.read',
        'offer.counter',
        'service.read',
        'service.order.create',
        'service.order.read',
        'service.lead.create',
        'service.lead.read',
    ],
    SERVICE_PROVIDER: [
        'provider.profile.read',
        'provider.profile.update',
        'provider.coverage.manage',
        'provider.listing.manage',
        'provider.menu.manage',
        'provider.order.read',
        'provider.order.manage',
        'provider.lead.read',
        'provider.lead.manage',
        'provider.dashboard.read',
        'provider.promotion.manage',
        'service.read',
    ],
};
async function seedPermissions() {
    await Promise.all(PERMISSIONS.map((perm) => prisma.permission.upsert({
        where: { action: perm.action },
        update: { description: perm.description },
        create: perm,
    })));
}
async function seedRoles() {
    await Promise.all(Object.values(client_1.RoleName).map((roleName) => prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
            name: roleName,
            description: `${roleName} role`,
        },
    })));
}
async function seedRolePermissions() {
    const [roles, permissions] = await Promise.all([
        prisma.role.findMany(),
        prisma.permission.findMany(),
    ]);
    const roleByName = new Map(roles.map((role) => [role.name, role.id]));
    const permissionByAction = new Map(permissions.map((permission) => [permission.action, permission.id]));
    const rows = [];
    for (const [roleName, actions] of Object.entries(ROLE_PERMISSIONS)) {
        const roleId = roleByName.get(roleName);
        if (!roleId) {
            throw new Error(`Role not found: ${roleName}`);
        }
        for (const action of actions) {
            const permissionId = permissionByAction.get(action);
            if (!permissionId) {
                throw new Error(`Permission not found: ${action}`);
            }
            rows.push({ roleId, permissionId });
        }
    }
    await prisma.rolePermission.createMany({
        data: rows,
        skipDuplicates: true,
    });
}
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
        where: { name: client_1.RoleName.ADMIN },
    });
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
        where: { email: email.toLowerCase() },
        update: {
            name: 'System Admin',
            password: hashedPassword,
            roleId: adminRole.id,
            isVerified: true,
            provider: client_1.AuthProvider.LOCAL,
        },
        create: {
            name: 'System Admin',
            email: email.toLowerCase(),
            password: hashedPassword,
            roleId: adminRole.id,
            isVerified: true,
            provider: client_1.AuthProvider.LOCAL,
        },
    });
    console.log(`Admin user seeded: ${email}`);
}
async function seedCategories() {
    for (const main of category_seed_data_1.CATEGORY_SEED) {
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
        await Promise.all(main.children.map((child) => prisma.category.upsert({
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
        })));
    }
    console.log('Categories seeded: main categories and subcategories.');
}
async function seedServiceCategories() {
    for (const category of service_category_seed_data_1.SERVICE_CATEGORY_SEED) {
        await prisma.serviceCategory.upsert({
            where: { slug: category.slug },
            update: {
                name: category.name,
                description: category.description,
                sortOrder: category.sortOrder,
                commissionRate: category.commissionRate,
                isActive: true,
            },
            create: {
                name: category.name,
                slug: category.slug,
                description: category.description,
                sortOrder: category.sortOrder,
                commissionRate: category.commissionRate,
                isActive: true,
            },
        });
    }
    console.log('Service categories seeded: restaurants, cafes, home-cooking, transport.');
}
async function seedDatabase() {
    await seedPermissions();
    await seedRoles();
    await seedRolePermissions();
    await seedCategories();
    await seedServiceCategories();
    await seedAdmin();
    await (0, demo_seed_1.seedDemoSite)(prisma);
    console.log('Seed completed: roles, permissions, categories, demo site (if SEED_DEMO).');
    console.log('ADMIN role has all permissions:', PERMISSIONS.map((p) => p.action).join(', '));
}
async function main() {
    await seedDatabase();
}
if (require.main === module) {
    main()
        .catch((e) => {
        console.error(e);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
//# sourceMappingURL=seed.js.map