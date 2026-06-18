-- Rekber seller fulfillment workflow + packaging proof (mirrors marketplace packaging)

ALTER TYPE "RekberStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "RekberStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';

ALTER TABLE "RekberTransaction"
  ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "shippingCourier" "ShippingCourier",
  ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingSummaryStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingSummaryDesc" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingLastEventAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trackingLastSyncedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trackingNextSyncAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trackingActive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "trackingSyncFailures" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "RekberPackagingProof" (
  "id" TEXT NOT NULL,
  "rekberId" TEXT NOT NULL,
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

  CONSTRAINT "RekberPackagingProof_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RekberPackagingProof_rekberId_key"
  ON "RekberPackagingProof"("rekberId");
CREATE INDEX IF NOT EXISTS "RekberPackagingProof_status_submittedAt_idx"
  ON "RekberPackagingProof"("status", "submittedAt");
CREATE INDEX IF NOT EXISTS "RekberPackagingProof_status_resubmitDeadline_idx"
  ON "RekberPackagingProof"("status", "resubmitDeadline");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RekberPackagingProof_rekberId_fkey'
  ) THEN
    ALTER TABLE "RekberPackagingProof"
      ADD CONSTRAINT "RekberPackagingProof_rekberId_fkey"
      FOREIGN KEY ("rekberId") REFERENCES "RekberTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RekberPackagingProof_sellerId_fkey'
  ) THEN
    ALTER TABLE "RekberPackagingProof"
      ADD CONSTRAINT "RekberPackagingProof_sellerId_fkey"
      FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RekberPackagingProof_reviewedById_fkey'
  ) THEN
    ALTER TABLE "RekberPackagingProof"
      ADD CONSTRAINT "RekberPackagingProof_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "RekberPackagingMedia" (
  "id" TEXT NOT NULL,
  "proofId" TEXT NOT NULL,
  "type" "OrderPackagingMediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RekberPackagingMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RekberPackagingMedia_proofId_idx"
  ON "RekberPackagingMedia"("proofId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RekberPackagingMedia_proofId_fkey'
  ) THEN
    ALTER TABLE "RekberPackagingMedia"
      ADD CONSTRAINT "RekberPackagingMedia_proofId_fkey"
      FOREIGN KEY ("proofId") REFERENCES "RekberPackagingProof"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
