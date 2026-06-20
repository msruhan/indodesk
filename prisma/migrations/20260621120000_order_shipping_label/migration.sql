ALTER TABLE "Order" ADD COLUMN "shippingLabelToken" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingLabelGeneratedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_shippingLabelToken_key" ON "Order"("shippingLabelToken");
