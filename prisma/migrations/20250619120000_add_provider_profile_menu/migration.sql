-- CreateTable
CREATE TABLE "service_provider_menu_items" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "prepTimeMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_provider_menu_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "service_orders" ALTER COLUMN "listingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "service_order_items" ADD COLUMN "menuItemId" TEXT;
ALTER TABLE "service_order_items" ADD COLUMN "prepTimeMinutes" INTEGER;

-- DropForeignKey
ALTER TABLE "service_orders" DROP CONSTRAINT "service_orders_listingId_fkey";

-- AddForeignKey
ALTER TABLE "service_provider_menu_items" ADD CONSTRAINT "service_provider_menu_items_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "service_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "service_provider_menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "service_provider_menu_items_providerId_isActive_sortOrder_idx" ON "service_provider_menu_items"("providerId", "isActive", "sortOrder");
CREATE INDEX "service_order_items_menuItemId_idx" ON "service_order_items"("menuItemId");
