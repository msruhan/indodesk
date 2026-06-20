-- CreateEnum
CREATE TYPE "ProductSaleCondition" AS ENUM ('NEW', 'USED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "saleCondition" "ProductSaleCondition" NOT NULL DEFAULT 'USED';
