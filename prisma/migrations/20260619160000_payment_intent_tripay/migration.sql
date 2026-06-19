-- PaymentIntent for Tripay closed payment (Phase 1: wallet topup)

CREATE TYPE "PaymentIntentPurpose" AS ENUM ('WALLET_TOPUP', 'KONSULTASI', 'MARKETPLACE', 'CATALOG_TOPUP');
CREATE TYPE "PaymentIntentStatus" AS ENUM ('UNPAID', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED');

CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "merchantRef" TEXT NOT NULL,
    "purpose" "PaymentIntentPurpose" NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT,
    "subtotal" DECIMAL(14,0) NOT NULL,
    "feeAmount" DECIMAL(14,0) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,0) NOT NULL,
    "channelCode" TEXT NOT NULL,
    "channelName" TEXT,
    "channelType" TEXT,
    "tripayReference" TEXT,
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'UNPAID',
    "payCode" TEXT,
    "qrUrl" TEXT,
    "qrString" TEXT,
    "checkoutUrl" TEXT,
    "payUrl" TEXT,
    "returnUrl" TEXT,
    "expiredAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentIntent_merchantRef_key" ON "PaymentIntent"("merchantRef");
CREATE UNIQUE INDEX "PaymentIntent_tripayReference_key" ON "PaymentIntent"("tripayReference");
CREATE INDEX "PaymentIntent_userId_status_idx" ON "PaymentIntent"("userId", "status");
CREATE INDEX "PaymentIntent_purpose_status_idx" ON "PaymentIntent"("purpose", "status");
CREATE INDEX "PaymentIntent_tripayReference_idx" ON "PaymentIntent"("tripayReference");

ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
