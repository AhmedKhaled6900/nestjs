-- AlterTable
ALTER TABLE "service_provider_profiles" ADD COLUMN "menuDeliveryFee" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "service_provider_menu_items" DROP COLUMN "deliveryFee";
