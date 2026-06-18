-- CreateEnum
CREATE TYPE "RekberComplaintStatus" AS ENUM ('OPEN', 'SELLER_RESPONDED', 'ESCALATED', 'RESOLVED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "RekberComplaint" (
    "id" TEXT NOT NULL,
    "rekberId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RekberComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "sellerResponse" TEXT,
    "sellerRespondedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" "OrderComplaintResolution",
    "refundAmount" DECIMAL(12,0),
    "adminNote" TEXT,
    "adminId" TEXT,
    "sellerDeadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RekberComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RekberComplaintMedia" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "type" "OrderComplaintMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RekberComplaintMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RekberComplaint_rekberId_key" ON "RekberComplaint"("rekberId");

-- CreateIndex
CREATE INDEX "RekberComplaint_status_sellerDeadline_idx" ON "RekberComplaint"("status", "sellerDeadline");

-- CreateIndex
CREATE INDEX "RekberComplaint_status_escalatedAt_idx" ON "RekberComplaint"("status", "escalatedAt");

-- CreateIndex
CREATE INDEX "RekberComplaintMedia_complaintId_idx" ON "RekberComplaintMedia"("complaintId");

-- AddForeignKey
ALTER TABLE "RekberComplaint" ADD CONSTRAINT "RekberComplaint_rekberId_fkey" FOREIGN KEY ("rekberId") REFERENCES "RekberTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekberComplaint" ADD CONSTRAINT "RekberComplaint_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekberComplaint" ADD CONSTRAINT "RekberComplaint_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekberComplaint" ADD CONSTRAINT "RekberComplaint_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekberComplaintMedia" ADD CONSTRAINT "RekberComplaintMedia_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "RekberComplaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
