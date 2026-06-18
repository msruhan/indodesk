-- CreateEnum
CREATE TYPE "ClientOs" AS ENUM ('WINDOWS', 'MACOS');

-- CreateEnum
CREATE TYPE "KonsultasiPaymentMethod" AS ENUM ('WALLET_HOLD', 'PAYMENT_GATEWAY', 'LEGACY_DEBIT');

-- CreateEnum
CREATE TYPE "KonsultasiPaymentStatus" AS ENUM ('UNPAID', 'HELD', 'PAID', 'SECURED', 'CAPTURED', 'RELEASED');

-- AlterEnum
ALTER TYPE "KonsultasiStatus" ADD VALUE 'AWAITING_PAYMENT' BEFORE 'PENDING';

-- AlterTable
ALTER TABLE "KonsultasiSession" ADD COLUMN     "note" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "clientOs" "ClientOs",
ADD COLUMN     "requiresRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remoteId" TEXT,
ADD COLUMN     "remoteOtp" TEXT,
ADD COLUMN     "paymentMethod" "KonsultasiPaymentMethod",
ADD COLUMN     "paymentStatus" "KonsultasiPaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "pgProvider" TEXT,
ADD COLUMN     "pgExternalRef" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "KonsultasiSession_pgExternalRef_key" ON "KonsultasiSession"("pgExternalRef");

-- CreateIndex
CREATE INDEX "KonsultasiSession_status_paymentStatus_idx" ON "KonsultasiSession"("status", "paymentStatus");

-- CreateIndex
CREATE INDEX "KonsultasiSession_userId_status_idx" ON "KonsultasiSession"("userId", "status");

-- CreateIndex
CREATE INDEX "KonsultasiSession_teknisiId_status_idx" ON "KonsultasiSession"("teknisiId", "status");

-- Backfill legacy sessions
UPDATE "KonsultasiSession"
SET "paymentStatus" = 'CAPTURED', "paymentMethod" = 'LEGACY_DEBIT'
WHERE "status" = 'COMPLETED';

UPDATE "KonsultasiSession"
SET "paymentStatus" = 'SECURED', "paymentMethod" = 'LEGACY_DEBIT'
WHERE "status" IN ('PENDING', 'ACTIVE');
