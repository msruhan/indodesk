-- Idempotency: satu entri ledger per (wallet, type, reference) bila referenceId ada.
CREATE UNIQUE INDEX IF NOT EXISTS "WalletLedger_walletId_type_referenceId_key"
ON "WalletLedger"("walletId", "type", "referenceId")
WHERE "referenceId" IS NOT NULL;
