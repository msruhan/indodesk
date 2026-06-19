-- Marketplace Tripay checkout: AWAITING_PAYMENT + payment metadata

CREATE TYPE "OrderPaymentMethod" AS ENUM ('WALLET', 'PAYMENT_GATEWAY');

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT' BEFORE 'PENDING';

ALTER TABLE "Order" ADD COLUMN "paymentMethod" "OrderPaymentMethod";
ALTER TABLE "Order" ADD COLUMN "pgProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN "pgExternalRef" TEXT;
ALTER TABLE "Order" ADD COLUMN "checkoutBatchId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentExpiresAt" TIMESTAMP(3);

CREATE INDEX "Order_checkoutBatchId_status_idx" ON "Order"("checkoutBatchId", "status");
CREATE INDEX "Order_pgExternalRef_idx" ON "Order"("pgExternalRef");
CREATE INDEX "Order_status_paymentExpiresAt_idx" ON "Order"("status", "paymentExpiresAt");
