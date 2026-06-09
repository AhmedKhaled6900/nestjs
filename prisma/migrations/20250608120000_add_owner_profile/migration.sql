-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('INCOMPLETE', 'BASIC_DONE', 'KYC_PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "owner_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownerType" "OwnerType",
    "companyName" TEXT,
    "taxNumber" TEXT,
    "commercialRegister" TEXT,
    "nationalId" TEXT,
    "whatsapp" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "area" TEXT,
    "bio" TEXT,
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owner_profiles_userId_key" ON "owner_profiles"("userId");

-- CreateIndex
CREATE INDEX "owner_profiles_profileStatus_idx" ON "owner_profiles"("profileStatus");

-- AddForeignKey
ALTER TABLE "owner_profiles" ADD CONSTRAINT "owner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
