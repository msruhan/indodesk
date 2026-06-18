-- Granular product categories: IPHONE, ANDROID, IPAD, MACBOOK, PC (replace HANDPHONE/TABLET)
CREATE TYPE "ProductCategory_new" AS ENUM (
  'IPHONE',
  'ANDROID',
  'IPAD',
  'MACBOOK',
  'LAPTOP',
  'PC',
  'AKSESORIS',
  'SOFTWARE',
  'LAINNYA'
);

ALTER TABLE "Product" ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "Product" ALTER COLUMN "category" TYPE "ProductCategory_new" USING (
  CASE "category"::text
    WHEN 'HANDPHONE' THEN (
      CASE COALESCE("deviceType"::text, 'IPHONE')
        WHEN 'ANDROID_PHONE' THEN 'ANDROID'
        ELSE 'IPHONE'
      END
    )::"ProductCategory_new"
    WHEN 'TABLET' THEN (
      CASE COALESCE("deviceType"::text, 'IPAD')
        WHEN 'ANDROID_TABLET' THEN 'LAINNYA'
        ELSE 'IPAD'
      END
    )::"ProductCategory_new"
    ELSE "category"::text::"ProductCategory_new"
  END
);

DROP TYPE "ProductCategory";
ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
