-- AlterEnum
ALTER TYPE "ServiceListingStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "ServiceListingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SERVICE_LISTING_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SERVICE_LISTING_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SERVICE_LISTING_REJECTED';

-- AlterTable
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_listings_status_isFeatured_idx" ON "service_listings"("status", "isFeatured");
