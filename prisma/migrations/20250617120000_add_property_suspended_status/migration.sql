-- AlterEnum
ALTER TYPE "PropertyStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "suspensionReason" TEXT;
ALTER TABLE "properties" ADD COLUMN "suspendedAt" TIMESTAMP(3);
