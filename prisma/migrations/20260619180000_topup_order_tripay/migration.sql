-- Catalog topup Tripay payment metadata

ALTER TABLE "TopupOrder" ADD COLUMN "pgProvider" TEXT;
ALTER TABLE "TopupOrder" ADD COLUMN "pgExternalRef" TEXT;
ALTER TABLE "TopupOrder" ADD COLUMN "paymentExpiresAt" TIMESTAMP(3);

CREATE INDEX "TopupOrder_pgExternalRef_idx" ON "TopupOrder"("pgExternalRef");
CREATE INDEX "TopupOrder_status_paymentExpiresAt_idx" ON "TopupOrder"("status", "paymentExpiresAt");
