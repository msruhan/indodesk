-- AlterEnum
ALTER TYPE "KonsultasiStatus" ADD VALUE 'AWAITING_CONFIRMATION';

-- DropIndex
DROP INDEX "TopupOrder_pgExternalRef_idx";

-- DropIndex
DROP INDEX "TopupOrder_pollTokenHash_idx";

-- DropIndex
DROP INDEX "TopupOrder_status_paymentExpiresAt_idx";

-- AlterTable
ALTER TABLE "KonsultasiSession" ADD COLUMN     "confirmDeadlineAt" TIMESTAMP(3),
ADD COLUMN     "teknisiMarkedDoneAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "KonsultasiSession_status_confirmDeadlineAt_idx" ON "KonsultasiSession"("status", "confirmDeadlineAt");
