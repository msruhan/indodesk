-- CreateEnum
CREATE TYPE "InspectionMode" AS ENUM ('ONLINE', 'OFFLINE');
CREATE TYPE "InspectionDeviceCategory" AS ENUM ('HANDPHONE', 'LAPTOP');
CREATE TYPE "InspectionProductSource" AS ENUM ('INDOTEKNIZII', 'TOKOPEDIA', 'SHOPEE', 'OLX', 'PRIVATE', 'OTHER');
CREATE TYPE "InspectionOrderStatus" AS ENUM ('PAID', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'REPORT_SUBMITTED', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE "InspectionOverallCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');
CREATE TYPE "InspectionRecommendation" AS ENUM ('RECOMMENDED', 'NEGOTIATE', 'NOT_RECOMMENDED');

-- CreateTable
CREATE TABLE "InspectionOrder" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teknisiId" TEXT NOT NULL,
    "mode" "InspectionMode" NOT NULL,
    "category" "InspectionDeviceCategory" NOT NULL,
    "status" "InspectionOrderStatus" NOT NULL DEFAULT 'PAID',
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "productBrand" TEXT NOT NULL DEFAULT '',
    "productModel" TEXT NOT NULL DEFAULT '',
    "productSource" "InspectionProductSource" NOT NULL DEFAULT 'OTHER',
    "productSourceUrl" TEXT,
    "sellerContact" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "city" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "price" DECIMAL(12,0) NOT NULL,
    "platformFee" DECIMAL(12,0) NOT NULL,
    "teknisiEarning" DECIMAL(12,0) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "ratingByUser" INTEGER,
    "reviewByUser" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectionReport" (
    "id" TEXT NOT NULL,
    "inspectionOrderId" TEXT NOT NULL,
    "overallCondition" "InspectionOverallCondition" NOT NULL,
    "recommendation" "InspectionRecommendation" NOT NULL,
    "checklistData" JSONB NOT NULL,
    "findings" TEXT NOT NULL,
    "suggestions" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certificateNumber" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InspectionOrder_orderCode_key" ON "InspectionOrder"("orderCode");
CREATE INDEX "InspectionOrder_userId_createdAt_idx" ON "InspectionOrder"("userId", "createdAt" DESC);
CREATE INDEX "InspectionOrder_teknisiId_status_idx" ON "InspectionOrder"("teknisiId", "status");
CREATE INDEX "InspectionOrder_status_idx" ON "InspectionOrder"("status");
CREATE UNIQUE INDEX "InspectionReport_inspectionOrderId_key" ON "InspectionReport"("inspectionOrderId");
CREATE UNIQUE INDEX "InspectionReport_certificateNumber_key" ON "InspectionReport"("certificateNumber");

-- AddForeignKey
ALTER TABLE "InspectionOrder" ADD CONSTRAINT "InspectionOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InspectionOrder" ADD CONSTRAINT "InspectionOrder_teknisiId_fkey" FOREIGN KEY ("teknisiId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_inspectionOrderId_fkey" FOREIGN KEY ("inspectionOrderId") REFERENCES "InspectionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
