-- Marketplace order cancellation (Tokopedia-style)

-- CreateEnum
CREATE TYPE "OrderCancellationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');
CREATE TYPE "OrderCancellationKind" AS ENUM ('INSTANT', 'APPROVAL_REQUIRED');

-- AlterEnum
ALTER TYPE "OrderCancelledBy" ADD VALUE IF NOT EXISTS 'BUYER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "processingAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OrderCancellationRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "kind" "OrderCancellationKind" NOT NULL,
    "status" "OrderCancellationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "sellerDeadline" TIMESTAMP(3),
    "sellerResponse" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCancellationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderCancellationRequest_orderId_key" ON "OrderCancellationRequest"("orderId");
CREATE INDEX "OrderCancellationRequest_sellerId_status_idx" ON "OrderCancellationRequest"("sellerId", "status");
CREATE INDEX "OrderCancellationRequest_status_sellerDeadline_idx" ON "OrderCancellationRequest"("status", "sellerDeadline");

ALTER TABLE "OrderCancellationRequest" ADD CONSTRAINT "OrderCancellationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
