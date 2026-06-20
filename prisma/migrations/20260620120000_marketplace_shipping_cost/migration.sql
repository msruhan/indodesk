-- Structured shipping address (buyer profile)
ALTER TABLE "User" ADD COLUMN "shippingCityId" TEXT;
ALTER TABLE "User" ADD COLUMN "shippingCityLabel" TEXT;
ALTER TABLE "User" ADD COLUMN "shippingDistrictId" TEXT;
ALTER TABLE "User" ADD COLUMN "shippingDistrictLabel" TEXT;
ALTER TABLE "User" ADD COLUMN "shippingLocationId" TEXT;
ALTER TABLE "User" ADD COLUMN "shippingLocationLabel" TEXT;
ALTER TABLE "User" ADD COLUMN "shippingStreet" TEXT;

-- Seller ship origin for cost API
ALTER TABLE "TeknisiStore" ADD COLUMN "shipOriginLocationId" TEXT;
ALTER TABLE "TeknisiStore" ADD COLUMN "shipOriginLocationLabel" TEXT;

-- Order shipping cost (per seller order)
ALTER TABLE "Order" ADD COLUMN "shippingLocationId" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingCost" DECIMAL(12,0) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingService" TEXT;
ALTER TABLE "Order" ADD COLUMN "checkoutShippingCourier" TEXT;
