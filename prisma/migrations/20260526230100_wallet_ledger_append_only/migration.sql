-- Append-only guard for WalletLedger (R3.2)
CREATE OR REPLACE FUNCTION wallet_ledger_block_modification()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'WalletLedger is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_ledger_block_update ON "WalletLedger";
CREATE TRIGGER wallet_ledger_block_update
  BEFORE UPDATE ON "WalletLedger"
  FOR EACH ROW EXECUTE FUNCTION wallet_ledger_block_modification();

DROP TRIGGER IF EXISTS wallet_ledger_block_delete ON "WalletLedger";
CREATE TRIGGER wallet_ledger_block_delete
  BEFORE DELETE ON "WalletLedger"
  FOR EACH ROW EXECUTE FUNCTION wallet_ledger_block_modification();
