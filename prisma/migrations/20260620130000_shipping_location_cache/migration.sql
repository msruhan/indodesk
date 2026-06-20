-- CreateEnum
CREATE TYPE "ShippingLocationType" AS ENUM ('PROVINCE', 'CITY', 'DISTRICT', 'VILLAGE');

-- CreateTable
CREATE TABLE "ShippingLocation" (
    "id" TEXT NOT NULL,
    "type" "ShippingLocationType" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parentId" TEXT,
    "binderbyteId" TEXT,
    "postalCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingLocation_type_code_key" ON "ShippingLocation"("type", "code");

-- CreateIndex
CREATE INDEX "ShippingLocation_type_parentId_idx" ON "ShippingLocation"("type", "parentId");

-- CreateIndex
CREATE INDEX "ShippingLocation_parentId_sortOrder_idx" ON "ShippingLocation"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "ShippingLocation_type_name_idx" ON "ShippingLocation"("type", "name");
