-- CreateTable
CREATE TABLE "TeknisiStore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "jamWeekdays" TEXT,
    "jamWeekend" TEXT,
    "coverImage" TEXT,
    "layanan" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "badge" TEXT,
    "listingStatus" "ProductListingStatus" NOT NULL DEFAULT 'APPROVED',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeknisiStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeknisiStore_userId_key" ON "TeknisiStore"("userId");

-- CreateIndex
CREATE INDEX "TeknisiStore_isPublished_listingStatus_idx" ON "TeknisiStore"("isPublished", "listingStatus");

-- AddForeignKey
ALTER TABLE "TeknisiStore" ADD CONSTRAINT "TeknisiStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
