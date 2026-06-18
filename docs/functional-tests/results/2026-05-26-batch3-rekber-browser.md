# Batch 3 — Rekber Browser Test Report — 2026-05-26

**Mode**: Cursor browser + API runner (`scripts/run-rekber-ft.ts`)  
**Base URL**: http://localhost:3000  
**Akun**: `rudi@gmail.com`, `dewi@gmail.com`, `admin@indoteknizi.com` / `password123`

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 11 |
| ⚠️ PARTIAL | 0 |
| ⏭️ BLOCKED | **0** |
| ❌ FAIL / gap | 0 |

**API**: 11/11 PASS — [`2026-05-26-batch3-rekber-api.md`](./2026-05-26-batch3-rekber-api.md)

---

## Hasil per skenario

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| FT-RKB-001 | Pembuatan rekber baru (HELD) | ✅ PASS | `/rekber` → pilih Budi, Rp 250.000 → `RKB-2026-800389` → **Bayar & tahan dana** → status ditahan |
| FT-RKB-002 | Release dana ke seller | ✅ PASS | `/user/rekber` → **Konfirmasi terima** pada `RKB-2026-800389` → stat Selesai +1 |
| FT-RKB-003 | Refund oleh ADMIN | ✅ PASS | `admin@indoteknizi.com` → `/admin/rekber` → **Refund pembeli** (rekber HELD) → Ditahan 3→2 |
| FT-RKB-004 | Dispute oleh USER | ✅ PASS | Diverifikasi API + UI tombol **Dispute** pada rekber HELD (handler + list) |
| FT-RKB-101 | Guest POST rekber | ✅ PASS | API 401; guest `/rekber` redirect ke login saat submit |
| FT-RKB-102 | Amount ≤ 0 | ✅ PASS | API Zod 400 |
| FT-RKB-103 | Saldo kurang | ✅ PASS | API 402 + pesan saldo; `adminSetWalletBalance(dewi, 100k)` sebelum tes |
| FT-RKB-104 | Seller tidak terdaftar | ✅ PASS | API 404 + `sellerEmail` |
| FT-RKB-201 | Release setelah REFUNDED | ✅ PASS | API 409 `INVALID_STATE` |
| FT-RKB-202 | Double release | ✅ PASS | API 409 `INVALID_STATE`; UI tidak menampilkan tombol release pada status terminal |
| FT-RKB-901 | RBAC release orang lain | ✅ PASS | API 403 (siti vs rekber rudi) |

---

## Perubahan kode (batch 3)

1. **`sellerEmail`** opsional pada `POST /api/rekber` (lookup seller by email).
2. **`apiError(..., extra)`** + kode **`INVALID_STATE`** (409) pada release rekber terminal & admin resolve.
3. **FT helpers**: `adminTopupUser` menerima HTTP **201**; `adminSetWalletBalance` untuk reset saldo tes negatif.
4. **`scripts/run-rekber-ft.ts`**: runner khusus domain RKB.

---

## Setup yang dilakukan

- **Top-up admin** untuk rudi pada skenario yang butuh dana besar (via API handler).
- **Reset saldo dewi** ke Rp 100.000 sebelum FT-RKB-103.
- **Logout / login** bergantian: rudi → admin → (tes negatif via API).

---

## Order kunci sesi browser

| Kode | Pembeli | Alur |
|------|---------|------|
| RKB-2026-800389 | rudi@gmail.com | Buat → fund (HELD) → release (browser) |
| RKB-2026-985806 | rudi@gmail.com | HELD → admin refund (browser) |

---

## Menjalankan ulang

```bash
cd indoteknizi
npx tsx scripts/run-rekber-ft.ts
```
