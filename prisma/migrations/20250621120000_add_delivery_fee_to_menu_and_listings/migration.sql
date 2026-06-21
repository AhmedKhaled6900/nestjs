-- AlterTable
ALTER TABLE "service_provider_menu_items" ADD COLUMN "deliveryFee" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "service_listings" ADD COLUMN "deliveryFee" DECIMAL(14,2) NOT NULL DEFAULT 0;
