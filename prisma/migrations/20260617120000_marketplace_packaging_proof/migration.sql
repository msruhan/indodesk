-- Marketplace packaging proof + complaint media types

ALTER TYPE "OrderComplaintMediaType" ADD VALUE IF NOT EXISTS 'UNBOXING_VIDEO';
ALTER TYPE "OrderComplaintMediaType" ADD VALUE IF NOT EXISTS 'DEFECT_PHOTO';

CREATE TYPE "OrderPackagingProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "OrderPackagingMediaType" AS ENUM ('PHOTO', 'VIDEO');

CREATE TABLE "OrderPackagingProof" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "status" "OrderPackagingProofStatus" NOT NULL DEFAULT 'PENDING',
  "rejectionNote" TEXT,
  "submittedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "resubmitDeadline" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "slaNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrderPackagingProof_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderPackagingProof_orderId_key" ON "OrderPackagingProof"("orderId");
CREATE INDEX "OrderPackagingProof_status_submittedAt_idx" ON "OrderPackagingProof"("status", "submittedAt");
CREATE INDEX "OrderPackagingProof_status_resubmitDeadline_idx" ON "OrderPackagingProof"("status", "resubmitDeadline");

ALTER TABLE "OrderPackagingProof"
  ADD CONSTRAINT "OrderPackagingProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderPackagingProof_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderPackagingProof_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OrderPackagingMedia" (
  "id" TEXT NOT NULL,
  "proofId" TEXT NOT NULL,
  "type" "OrderPackagingMediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderPackagingMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderPackagingMedia_proofId_idx" ON "OrderPackagingMedia"("proofId");

ALTER TABLE "OrderPackagingMedia"
  ADD CONSTRAINT "OrderPackagingMedia_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "OrderPackagingProof"("id") ON DELETE CASCADE ON UPDATE CASCADE;
