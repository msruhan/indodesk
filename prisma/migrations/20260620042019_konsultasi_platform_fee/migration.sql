-- AlterTable: fee konsultasi (backfill sesi lama = 100% ke teknisi)
ALTER TABLE "KonsultasiSession" ADD COLUMN "platformFee" DECIMAL(12,0) NOT NULL DEFAULT 0;
ALTER TABLE "KonsultasiSession" ADD COLUMN "teknisiEarning" DECIMAL(12,0);
UPDATE "KonsultasiSession" SET "teknisiEarning" = "price" WHERE "teknisiEarning" IS NULL;
ALTER TABLE "KonsultasiSession" ALTER COLUMN "teknisiEarning" SET NOT NULL;
