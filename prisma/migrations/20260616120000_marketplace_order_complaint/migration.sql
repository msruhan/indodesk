-- Marketplace order completion & complaint flow
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

CREATE TYPE "OrderComplaintStatus" AS ENUM ('OPEN', 'SELLER_RESPONDED', 'ESCALATED', 'RESOLVED', 'WITHDRAWN');
CREATE TYPE "OrderComplaintResolution" AS ENUM ('REFUND_FULL', 'REFUND_PARTIAL', 'REJECTED');
CREATE TYPE "OrderComplaintMediaType" AS ENUM ('PHOTO', 'VIDEO');

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "buyerActionDeadline" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "autoCompletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Order_status_buyerActionDeadline_idx" ON "Order"("status", "buyerActionDeadline");

CREATE TABLE "OrderComplaint" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "OrderComplaintStatus" NOT NULL DEFAULT 'OPEN',
  "sellerResponse" TEXT,
  "sellerRespondedAt" TIMESTAMP(3),
  "escalatedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "resolution" "OrderComplaintResolution",
  "refundAmount" DECIMAL(12,0),
  "adminNote" TEXT,
  "adminId" TEXT,
  "sellerDeadline" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrderComplaint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderComplaint_orderId_key" ON "OrderComplaint"("orderId");
CREATE INDEX "OrderComplaint_status_sellerDeadline_idx" ON "OrderComplaint"("status", "sellerDeadline");
CREATE INDEX "OrderComplaint_status_escalatedAt_idx" ON "OrderComplaint"("status", "escalatedAt");

ALTER TABLE "OrderComplaint"
  ADD CONSTRAINT "OrderComplaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderComplaint_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderComplaint_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderComplaint_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OrderComplaintMedia" (
  "id" TEXT NOT NULL,
  "complaintId" TEXT NOT NULL,
  "type" "OrderComplaintMediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderComplaintMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderComplaintMedia_complaintId_idx" ON "OrderComplaintMedia"("complaintId");

ALTER TABLE "OrderComplaintMedia"
  ADD CONSTRAINT "OrderComplaintMedia_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "OrderComplaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
