-- CreateEnum
CREATE TYPE "OrderComplaintType" AS ENUM ('RETURN_REQUIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderComplaintMediaType" ADD VALUE IF NOT EXISTS 'RETURN_PHOTO';
ALTER TYPE "OrderComplaintMediaType" ADD VALUE IF NOT EXISTS 'RETURN_VIDEO';
ALTER TYPE "OrderComplaintMediaType" ADD VALUE IF NOT EXISTS 'RETURN_REJECT_PHOTO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderComplaintStatus" ADD VALUE IF NOT EXISTS 'AWAITING_RETURN';
ALTER TYPE "OrderComplaintStatus" ADD VALUE IF NOT EXISTS 'RETURN_SHIPPED';
ALTER TYPE "OrderComplaintStatus" ADD VALUE IF NOT EXISTS 'AWAITING_SELLER_CONFIRM';
ALTER TYPE "OrderComplaintStatus" ADD VALUE IF NOT EXISTS 'RETURN_EXPIRED';

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "settlementVersion" SET DEFAULT 2;

-- AlterTable
ALTER TABLE "OrderComplaint" ADD COLUMN     "returnCourier" "ShippingCourier",
ADD COLUMN     "returnDeadline" TIMESTAMP(3),
ADD COLUMN     "returnDeliveredAt" TIMESTAMP(3),
ADD COLUMN     "returnLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "returnNextSyncAt" TIMESTAMP(3),
ADD COLUMN     "returnShippedAt" TIMESTAMP(3),
ADD COLUMN     "returnSummaryStatus" TEXT,
ADD COLUMN     "returnSyncFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "returnTrackingActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnTrackingNumber" TEXT,
ADD COLUMN     "sellerConfirmDeadline" TIMESTAMP(3),
ADD COLUMN     "sellerReturnRejectReason" TEXT,
ADD COLUMN     "sellerReturnRejectedAt" TIMESTAMP(3),
ADD COLUMN     "type" "OrderComplaintType" NOT NULL DEFAULT 'RETURN_REQUIRED';

-- CreateTable
CREATE TABLE "OrderReturnTrackingEvent" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderReturnTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderReturnTrackingEvent_complaintId_occurredAt_idx" ON "OrderReturnTrackingEvent"("complaintId", "occurredAt");

-- CreateIndex
CREATE INDEX "OrderComplaint_status_returnDeadline_idx" ON "OrderComplaint"("status", "returnDeadline");

-- CreateIndex
CREATE INDEX "OrderComplaint_status_sellerConfirmDeadline_idx" ON "OrderComplaint"("status", "sellerConfirmDeadline");

-- CreateIndex
CREATE INDEX "OrderComplaint_returnTrackingActive_returnNextSyncAt_idx" ON "OrderComplaint"("returnTrackingActive", "returnNextSyncAt");

-- AddForeignKey
ALTER TABLE "OrderReturnTrackingEvent" ADD CONSTRAINT "OrderReturnTrackingEvent_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "OrderComplaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
