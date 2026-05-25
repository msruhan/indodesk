-- Approved listings should be visible on marketplace (auto-publish on admin approval).
UPDATE "Product"
SET "isPublished" = true
WHERE "listingStatus" = 'APPROVED' AND "isPublished" = false;

UPDATE "TeknisiStore"
SET "isPublished" = true
WHERE "listingStatus" = 'APPROVED' AND "isPublished" = false;
