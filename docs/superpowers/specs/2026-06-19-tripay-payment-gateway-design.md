# Tripay Payment Gateway — Design Spec

**Date:** 2026-06-19  
**Status:** Approved — all 4 phases complete  
**Callback URL:** `https://bantoo.in/api/payments/tripay/callback`

## Scope

| Purpose | Description |
|---------|-------------|
| `WALLET_TOPUP` | Topup saldo wallet via Tripay |
| `KONSULTASI` | Bayar konsultasi langsung (Phase 2) |
| `MARKETPLACE` | Checkout marketplace via PG (Phase 3) |
| `CATALOG_TOPUP` | Topup pulsa/katalog tanpa wallet (Phase 4) |

## Fee model (Option A)

Fee channel Tripay **ditanggung user**:

- `subtotal` = nominal layanan/produk/topup
- `feeAmount` = dari Tripay fee-calculator
- `amount` = subtotal + feeAmount (dikirim ke Tripay)
- Fulfillment memproses **`subtotal`** (bukan total bayar)

## Architecture

- Model `PaymentIntent` (merchantRef, purpose, amounts, Tripay refs, status)
- `src/lib/tripay/` — client, signature, config
- `POST /api/payments/tripay/callback` — verify `X-Callback-Signature`, dispatch fulfillers
- Phased rollout: wallet → konsultasi → marketplace → catalog

## Security

- HMAC-SHA256 callback verification (raw JSON body + private key)
- Idempotent PAID processing via ledger referenceId
- Validate `total_amount === intent.amount` on callback
