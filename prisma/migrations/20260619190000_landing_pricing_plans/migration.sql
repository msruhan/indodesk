-- CreateTable
CREATE TABLE "LandingPricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" TEXT NOT NULL,
    "priceSubtext" TEXT NOT NULL DEFAULT '',
    "cta" TEXT NOT NULL DEFAULT 'Mulai',
    "ctaHref" TEXT NOT NULL DEFAULT '/register',
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'sparkles',
    "features" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandingPricingPlan_isActive_sortOrder_idx" ON "LandingPricingPlan"("isActive", "sortOrder");
