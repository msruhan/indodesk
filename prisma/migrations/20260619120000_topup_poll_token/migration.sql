-- Secret poll token for topup order status API (hashed at rest).
ALTER TABLE "TopupOrder" ADD COLUMN "pollTokenHash" TEXT;

CREATE INDEX "TopupOrder_pollTokenHash_idx" ON "TopupOrder"("pollTokenHash");
