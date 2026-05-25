-- CreateTable
CREATE TABLE "TeknisiPortfolioCase" (
    "id" TEXT NOT NULL,
    "teknisiId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "glow" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeknisiPortfolioCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeknisiPortfolioCase_teknisiId_sortOrder_idx" ON "TeknisiPortfolioCase"("teknisiId", "sortOrder");

-- AddForeignKey
ALTER TABLE "TeknisiPortfolioCase" ADD CONSTRAINT "TeknisiPortfolioCase_teknisiId_fkey" FOREIGN KEY ("teknisiId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
