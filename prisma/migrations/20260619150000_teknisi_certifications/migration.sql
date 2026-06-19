-- CreateTable
CREATE TABLE "TeknisiCertification" (
    "id" TEXT NOT NULL,
    "teknisiId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeknisiCertification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeknisiCertification_teknisiId_sortOrder_idx" ON "TeknisiCertification"("teknisiId", "sortOrder");

-- AddForeignKey
ALTER TABLE "TeknisiCertification" ADD CONSTRAINT "TeknisiCertification_teknisiId_fkey" FOREIGN KEY ("teknisiId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
