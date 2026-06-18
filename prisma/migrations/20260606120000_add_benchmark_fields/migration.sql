-- Tambah kategori TABLET ke enum ProductCategory
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'TABLET';

-- CreateEnum DeviceType
DO $$ BEGIN
  CREATE TYPE "DeviceType" AS ENUM ('IPHONE', 'ANDROID_PHONE', 'IPAD', 'ANDROID_TABLET');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum ConditionGrade
DO $$ BEGIN
  CREATE TYPE "ConditionGrade" AS ENUM ('BNIB', 'LIKE_NEW', 'MULUS', 'NORMAL', 'MINUS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable Product — kondisi + 3uTools terstruktur
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deviceType" "DeviceType";
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "conditionGrade" "ConditionGrade";
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "conditionPercent" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "minusNotes" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "batteryHealth" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "batteryCycle" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isAllOriginal" BOOLEAN;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "replacedParts" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "trueToneActive" BOOLEAN;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "faceIdWorks" BOOLEAN;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "verified3uTools" BOOLEAN NOT NULL DEFAULT false;
