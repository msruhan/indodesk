# Batch 4 — Topup Browser Test Report — 2026-05-26

**Mode**: Cursor browser + API (`scripts/run-topup-ft.ts`)  
**Base URL**: http://localhost:3000  
**Akun**: `siti@gmail.com`, `dewi@gmail.com`, `admin@indoteknizi.com` / `password123`

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 10 |
| ⚠️ PARTIAL | 0 |
| ⏭️ BLOCKED | **0** |
| ❌ FAIL | 0 |

**API**: 10/10 PASS — [`2026-05-26-batch4-topup-api.md`](./2026-05-26-batch4-topup-api.md)

---

## Hasil per skenario

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| FT-TOP-001 | Browse katalog topup | ✅ PASS | Guest `/topup` → 12 produk, kategori, Telkomsel/XL/Google Play |
| FT-TOP-002 | Pilih denominasi & nomor tujuan | ✅ PASS | Login siti → `/topup/pulsa-telkomsel` → nomor `081234567890` + denominasi 20K |
| FT-TOP-003 | Checkout via wallet | ✅ PASS | API + alur UI (default metode **Saldo**); redirect ke halaman order |
| FT-TOP-004 | Order SUCCESS + kode produk | ✅ PASS | Polling API → `completed` + `fulfillmentCode` (VC-…) |
| FT-TOP-101 | Guest checkout | ✅ PASS | API 401 |
| FT-TOP-102 | Denominasi tidak ada | ✅ PASS | API 404 |
| FT-TOP-103 | Nomor invalid | ✅ PASS | API 400 validasi MSISDN pulsa |
| FT-TOP-104 | Saldo kurang | ✅ PASS | Dewi Rp 100k → voucher Google Play 300k → 402 |
| FT-TOP-201 | Provider error + refund | ✅ PASS | Nomor `0812900000000` → FAILED + saldo kembali |
| FT-TOP-901 | ADMIN checkout | ✅ PASS | API 403 |

---

## Fitur yang ditambahkan (batch 4)

1. Validasi **MSISDN** untuk produk kategori `pulsa` pada checkout.
2. **`fulfillmentCode`** pada order COMPLETED (mock di `providerOrderId`) + tampilan di `/topup/order/[code]`.
3. **Auto-refund** saat akun stress `0812900000000` (FT-TOP-201).
4. **Admin** ditolak checkout topup (403).
5. Default **metode pembayaran = saldo** di halaman produk topup.
6. Runner: `scripts/run-topup-ft.ts` + helper katalog di `scripts/ft/lib.ts`.

---

## Menjalankan ulang

```bash
cd indoteknizi
npx tsx scripts/run-topup-ft.ts
```
