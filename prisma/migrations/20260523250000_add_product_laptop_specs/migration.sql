-- Laptop-specific product specs
ALTER TABLE "Product" ADD COLUMN "ram" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "processor" TEXT NOT NULL DEFAULT '';
