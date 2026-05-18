-- CreateEnum
CREATE TYPE "ProductListingStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listingStatus" "ProductListingStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "soldCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "stock" SET DEFAULT 1;
