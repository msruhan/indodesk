-- CreateTable
CREATE TABLE "TopupCatalogProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "accent" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 4.8,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "ordersToday" INTEGER NOT NULL DEFAULT 0,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "idLabel" TEXT NOT NULL DEFAULT 'User ID',
    "serverLabel" TEXT,
    "idHelp" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopupCatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopupDenomination" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "basePrice" DECIMAL(12,0) NOT NULL,
    "salePrice" DECIMAL(12,0),
    "badge" TEXT,
    "flashSaleSold" INTEGER,
    "flashSaleQuota" INTEGER,
    "flashSaleEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopupDenomination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopupCatalogProduct_slug_key" ON "TopupCatalogProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TopupDenomination_sku_key" ON "TopupDenomination"("sku");

-- AddForeignKey
ALTER TABLE "TopupDenomination" ADD CONSTRAINT "TopupDenomination_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TopupCatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
