-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'DATE');

-- CreateEnum
CREATE TYPE "AttributeScope" AS ENUM ('SYSTEM', 'COMPANY');

-- CreateTable
CREATE TABLE "attributes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "scope" "AttributeScope" NOT NULL,
    "options" JSONB,
    "companyId" TEXT,
    "createdById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategory_attributes" (
    "subcategoryId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subcategory_attributes_pkey" PRIMARY KEY ("subcategoryId","attributeId")
);

-- CreateTable
CREATE TABLE "property_attribute_values" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "attributeId" TEXT,
    "customName" TEXT,
    "customType" "AttributeType",
    "value" JSONB NOT NULL,

    CONSTRAINT "property_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attributes_slug_key" ON "attributes"("slug");

-- CreateIndex
CREATE INDEX "attributes_scope_isActive_idx" ON "attributes"("scope", "isActive");

-- CreateIndex
CREATE INDEX "attributes_companyId_idx" ON "attributes"("companyId");

-- CreateIndex
CREATE INDEX "subcategory_attributes_subcategoryId_sortOrder_idx" ON "subcategory_attributes"("subcategoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "property_attribute_values_propertyId_idx" ON "property_attribute_values"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "property_attribute_values_propertyId_attributeId_key" ON "property_attribute_values"("propertyId", "attributeId");

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory_attributes" ADD CONSTRAINT "subcategory_attributes_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory_attributes" ADD CONSTRAINT "subcategory_attributes_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_attribute_values" ADD CONSTRAINT "property_attribute_values_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_attribute_values" ADD CONSTRAINT "property_attribute_values_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
