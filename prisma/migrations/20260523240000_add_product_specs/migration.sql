-- CreateEnum
CREATE TYPE "ProductWarranty" AS ENUM ('NONE', 'OFFICIAL', 'STORE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "color" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "storage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "warranty" "ProductWarranty" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Product" ADD COLUMN "completeness" JSONB NOT NULL DEFAULT '[]';
