ALTER TABLE "TeknisiProfile" ADD COLUMN "shipOriginCityId" TEXT;
ALTER TABLE "TeknisiProfile" ADD COLUMN "shipOriginCityLabel" TEXT;
ALTER TABLE "TeknisiProfile" ADD COLUMN "shipOriginDistrictId" TEXT;
ALTER TABLE "TeknisiProfile" ADD COLUMN "shipOriginDistrictLabel" TEXT;
ALTER TABLE "TeknisiProfile" ADD COLUMN "shipOriginLocationId" TEXT;
ALTER TABLE "TeknisiProfile" ADD COLUMN "shipOriginLocationLabel" TEXT;
ALTER TABLE "TeknisiProfile" ADD COLUMN "shipOriginStreet" TEXT;

-- Salin data lama dari toko (jika ada) ke profil teknisi
UPDATE "TeknisiProfile" tp
SET
  "shipOriginCityId" = ts."shipOriginCityId",
  "shipOriginCityLabel" = ts."shipOriginCityLabel",
  "shipOriginDistrictId" = ts."shipOriginDistrictId",
  "shipOriginDistrictLabel" = ts."shipOriginDistrictLabel",
  "shipOriginLocationId" = ts."shipOriginLocationId",
  "shipOriginLocationLabel" = ts."shipOriginLocationLabel",
  "shipOriginStreet" = ts."shipOriginStreet"
FROM "TeknisiStore" ts
WHERE ts."userId" = tp."userId"
  AND tp."shipOriginLocationId" IS NULL
  AND ts."shipOriginLocationId" IS NOT NULL;
