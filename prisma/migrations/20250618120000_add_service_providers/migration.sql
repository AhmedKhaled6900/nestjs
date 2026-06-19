-- AlterEnum
ALTER TYPE "RoleName" ADD VALUE 'SERVICE_PROVIDER';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_PROVIDER_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_PROVIDER_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_PROVIDER_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_PROVIDER_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_ORDER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_ORDER_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_ORDER_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_ORDER_STATUS_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_LEAD_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_LEAD_STATUS_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'PROVIDER_PROMOTION_ACTIVATED';

-- CreateEnum
CREATE TYPE "ServiceProviderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'SUSPENDED');
CREATE TYPE "ServiceListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED');
CREATE TYPE "ServiceOrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED');
CREATE TYPE "ServiceLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'COMPLETED', 'LOST');
CREATE TYPE "ProviderPromotionType" AS ENUM ('HERO', 'FEATURED');
CREATE TYPE "ProviderPromotionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_provider_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "nationalId" TEXT,
    "commercialRegister" TEXT,
    "status" "ServiceProviderStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_provider_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_coverage_areas" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_coverage_areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_listings" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "menuItems" JSONB,
    "metadata" JSONB,
    "status" "ServiceListingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "deliveryFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "providerNet" DECIMAL(14,2) NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "deliveryArea" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "service_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_leads" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupArea" TEXT,
    "destination" TEXT NOT NULL,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "preferredDateTime" TIMESTAMP(3),
    "notes" TEXT,
    "status" "ServiceLeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_promotions" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "listingId" TEXT,
    "type" "ProviderPromotionType" NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymobOrderId" TEXT,
    "status" "ProviderPromotionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");
CREATE INDEX "service_categories_isActive_sortOrder_idx" ON "service_categories"("isActive", "sortOrder");
CREATE UNIQUE INDEX "service_provider_profiles_userId_key" ON "service_provider_profiles"("userId");
CREATE INDEX "service_provider_profiles_categoryId_idx" ON "service_provider_profiles"("categoryId");
CREATE INDEX "service_provider_profiles_status_idx" ON "service_provider_profiles"("status");
CREATE UNIQUE INDEX "service_coverage_areas_providerId_city_area_key" ON "service_coverage_areas"("providerId", "city", "area");
CREATE INDEX "service_coverage_areas_city_area_isActive_idx" ON "service_coverage_areas"("city", "area", "isActive");
CREATE INDEX "service_coverage_areas_providerId_idx" ON "service_coverage_areas"("providerId");
CREATE INDEX "service_listings_providerId_status_idx" ON "service_listings"("providerId", "status");
CREATE INDEX "service_listings_categoryId_status_idx" ON "service_listings"("categoryId", "status");
CREATE INDEX "service_orders_customerId_status_idx" ON "service_orders"("customerId", "status");
CREATE INDEX "service_orders_providerId_status_idx" ON "service_orders"("providerId", "status");
CREATE INDEX "service_orders_status_createdAt_idx" ON "service_orders"("status", "createdAt");
CREATE INDEX "service_order_items_orderId_idx" ON "service_order_items"("orderId");
CREATE INDEX "service_leads_customerId_status_idx" ON "service_leads"("customerId", "status");
CREATE INDEX "service_leads_providerId_status_idx" ON "service_leads"("providerId", "status");
CREATE INDEX "provider_promotions_providerId_status_idx" ON "provider_promotions"("providerId", "status");
CREATE INDEX "provider_promotions_status_startsAt_endsAt_idx" ON "provider_promotions"("status", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "service_provider_profiles" ADD CONSTRAINT "service_provider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_provider_profiles" ADD CONSTRAINT "service_provider_profiles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_coverage_areas" ADD CONSTRAINT "service_coverage_areas_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "service_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_leads" ADD CONSTRAINT "service_leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_leads" ADD CONSTRAINT "service_leads_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_promotions" ADD CONSTRAINT "provider_promotions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_promotions" ADD CONSTRAINT "provider_promotions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "service_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
