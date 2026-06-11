-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PRICE_OFFER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'PRICE_OFFER_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'PRICE_OFFER_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'PRICE_OFFER_COUNTERED';
ALTER TYPE "NotificationType" ADD VALUE 'PRICE_OFFER_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'PRICE_OFFER_NEGOTIATING_FAILED';

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'NEGOTIATING', 'NEGOTIATING_FAIL');

-- CreateEnum
CREATE TYPE "OfferSenderRole" AS ENUM ('CUSTOMER', 'OWNER');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "isNegotiable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "price_offers" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "customerOfferCount" INTEGER NOT NULL DEFAULT 1,
    "ownerOfferCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_offer_rounds" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "senderRole" "OfferSenderRole" NOT NULL,
    "senderId" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "pricePeriod" "PricePeriod" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_offer_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_offers_propertyId_status_idx" ON "price_offers"("propertyId", "status");

-- CreateIndex
CREATE INDEX "price_offers_customerId_status_idx" ON "price_offers"("customerId", "status");

-- CreateIndex
CREATE INDEX "price_offers_status_expiresAt_idx" ON "price_offers"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "price_offer_rounds_offerId_createdAt_idx" ON "price_offer_rounds"("offerId", "createdAt");

-- AddForeignKey
ALTER TABLE "price_offers" ADD CONSTRAINT "price_offers_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_offers" ADD CONSTRAINT "price_offers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_offer_rounds" ADD CONSTRAINT "price_offer_rounds_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "price_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
