-- CreateEnum
CREATE TYPE "TeknisiVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "TeknisiProfile" ADD COLUMN "verificationStatus" "TeknisiVerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "TeknisiProfile" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "TeknisiProfile" ADD COLUMN "applicationData" JSONB NOT NULL DEFAULT '{}';

-- Backfill from existing isVerified
UPDATE "TeknisiProfile" SET "verificationStatus" = 'APPROVED' WHERE "isVerified" = true;
UPDATE "TeknisiProfile" SET "verificationStatus" = 'PENDING' WHERE "isVerified" = false;
