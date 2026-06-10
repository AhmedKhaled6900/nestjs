-- CreateEnum
CREATE TYPE "PricePeriod" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "pricePeriod" "PricePeriod";
