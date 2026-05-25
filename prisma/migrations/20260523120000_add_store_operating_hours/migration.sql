-- AlterTable
ALTER TABLE "TeknisiStore" ADD COLUMN IF NOT EXISTS "operatingHours" JSONB NOT NULL DEFAULT '{}';
