-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PROPERTY_RENTED';

-- CreateEnum
CREATE TYPE "RentalSource" AS ENUM ('DIRECT_BOOKING', 'NEGOTIATION');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "price_offer_rounds" ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "property_rentals" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "offerId" TEXT,
    "source" "RentalSource" NOT NULL,
    "agreedPrice" DECIMAL(14,2) NOT NULL,
    "pricePeriod" "PricePeriod" NOT NULL,
    "duration" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_rentals_offerId_key" ON "property_rentals"("offerId");

-- CreateIndex
CREATE INDEX "property_rentals_propertyId_status_idx" ON "property_rentals"("propertyId", "status");

-- CreateIndex
CREATE INDEX "property_rentals_tenantId_status_idx" ON "property_rentals"("tenantId", "status");

-- CreateIndex
CREATE INDEX "property_rentals_endsAt_idx" ON "property_rentals"("endsAt");

-- AddForeignKey
ALTER TABLE "property_rentals" ADD CONSTRAINT "property_rentals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_rentals" ADD CONSTRAINT "property_rentals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_rentals" ADD CONSTRAINT "property_rentals_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "price_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
