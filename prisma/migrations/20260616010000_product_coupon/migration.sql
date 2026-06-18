-- Kupon diskon per produk (dibuat teknisi)
CREATE TYPE "ProductCouponDiscountType" AS ENUM ('PERCENT', 'FIXED');

ALTER TABLE "Product"
  ADD COLUMN "couponCode" TEXT,
  ADD COLUMN "couponDiscountType" "ProductCouponDiscountType",
  ADD COLUMN "couponDiscountValue" DECIMAL(12,0);
