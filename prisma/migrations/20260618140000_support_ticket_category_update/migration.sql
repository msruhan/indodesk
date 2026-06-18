-- Replace SupportTicketCategory: drop PAYMENT_WALLET, add KONSULTASI & INSPEKSI
CREATE TYPE "SupportTicketCategory_new" AS ENUM (
  'SERVICE_ISSUE',
  'KONSULTASI',
  'INSPEKSI',
  'MARKETPLACE',
  'ACCOUNT_SECURITY',
  'PLATFORM_BUG',
  'OTHER'
);

ALTER TABLE "SupportTicket"
  ALTER COLUMN "category" TYPE "SupportTicketCategory_new"
  USING (
    CASE "category"::text
      WHEN 'PAYMENT_WALLET' THEN 'OTHER'
      ELSE "category"::text
    END
  )::"SupportTicketCategory_new";

DROP TYPE "SupportTicketCategory";
ALTER TYPE "SupportTicketCategory_new" RENAME TO "SupportTicketCategory";
