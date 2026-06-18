-- Marketplace escrow: fee snapshot fields + seller cancel metadata
CREATE TYPE "OrderCancelledBy" AS ENUM ('SELLER', 'ADMIN', 'SYSTEM');

ALTER TABLE "Order"
  ADD COLUMN "buyerFeeAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN "sellerFeeAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN "buyerHoldAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN "sellerNetAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN "settlementVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "cancelReason" TEXT,
  ADD COLUMN "cancelledBy" "OrderCancelledBy";

-- Existing orders used immediate debit/credit at checkout (legacy settlement v1)
UPDATE "Order" SET "settlementVersion" = 1 WHERE "settlementVersion" = 1;
