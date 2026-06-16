# Marketplace Escrow, Dual Fees & Seller Cancellation — Design Spec

**Tanggal**: 2026-06-16  
**Status**: Approved (brainstorming session)  
**Amends**: `2026-06-16-marketplace-order-completion-design.md` — mengganti keputusan escrow *out of scope*  
**Author**: Brainstorming session  

---

## 1. Tujuan

Mengubah alur keuangan marketplace agar:

1. **Pembeli** — dana di-**hold** (escrow) saat checkout, bukan langsung hilang tanpa jejak; tampil breakdown saldo tersedia vs ditahan.
2. **Teknisi (penjual)** — saldo **hanya bertambah** saat order **COMPLETED** (konfirmasi pembeli atau auto-selesai 3 hari pasca DELIVERED), setelah dipotong **fee penjual**.
3. **Platform** — mengenakan **dua fee terpisah**: fee pembeli (ditambahkan ke checkout) dan fee penjual (dipotong saat release).
4. **Penjual** — dapat membatalkan order **PAID / PROCESSING** dengan **form alasan wajib** (min. 20 karakter); dana pembeli dikembalikan penuh.
5. **Admin** — mengatur kedua persentase fee di section baru **Keuangan Marketplace** pada halaman Settings.

Masalah yang diselesaikan: saat ini `creditSellerForMarketplace` dipanggil di checkout sehingga teknisi langsung terima `EARNING` (contoh ORD-2026-G1TXGC: +Rp 8.000 padahal order masih Dikirim).

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Hold pembeli | Saat **checkout** — nominal produk + **fee pembeli** |
| Kredit teknisi | Saat order **COMPLETED** saja — nominal produk − **fee penjual** |
| Fee pembeli | **Ditambahkan** ke total checkout (pembeli bayar lebih) |
| Fee penjual | **Dipotong** dari hasil jual saat release ke teknisi |
| Tampilan saldo pembeli | Breakdown: **Saldo Tersedia** + **Ditahan (Escrow)** + Total |
| Tampilan saldo teknisi | **Pending earnings** (informatif, pre-COMPLETED) + **EARNING** setelah COMPLETED |
| Pembatalan penjual | Hanya **PAID** & **PROCESSING**; alasan wajib **min. 20 karakter** |
| Refund pembatalan | **Full hold** kembali ke pembeli (produk + fee pembeli) |
| Refund komplain (admin) | **REFUND_FULL** → full hold; **REFUND_PARTIAL** → sebagian hold; **REJECTED** → release ke teknisi (neto) |
| Pengaturan fee admin | Section **Keuangan Marketplace** di `/admin/settings` |
| Pendekatan teknis escrow | **Ledger-only** (pola Rekber/Konsultasi) + agregat API untuk breakdown UI |
| Produk digital/software | **Out of scope** — alur terpisah nanti |

---

## 3. Konteks codebase

| Komponen | Kondisi saat ini |
|----------|------------------|
| `processMarketplaceCheckout` | `debitBuyerForMarketplace` + `creditSellerForMarketplace` — **harus diubah** |
| `completeMarketplaceOrder` | Set status COMPLETED — **harus tambah release escrow** |
| `rekber-wallet.ts` | Pola `ESCROW_HOLD` / `ESCROW_RELEASE` / `REFUND` — **referensi utama** |
| `konsultasi-wallet.ts` | Pola hold sampai layanan selesai — referensi |
| `feePercent` tunggal | Ada di `PlatformSettingsDto` — **ganti** jadi `buyerFeePercent` + `sellerFeePercent` |
| Pembatalan penjual | Ada tanpa field `cancelReason` — **tambah validasi + schema** |
| Spec completion v1 | Escrow explicitly out of scope — **di-amend oleh dokumen ini** |

---

## 4. Contoh perhitungan

Produk **Rp 100.000** · Fee pembeli **2%** · Fee penjual **2,5%**

| Pihak | Perhitungan | Nominal |
|-------|-------------|---------|
| Subtotal produk | — | Rp 100.000 |
| Fee pembeli | 100.000 × 2% | Rp 2.000 |
| **Hold pembeli** | 100.000 + 2.000 | **Rp 102.000** |
| Fee penjual | 100.000 × 2,5% | Rp 2.500 |
| **Neto teknisi** | 100.000 − 2.500 | **Rp 97.500** |
| **Pendapatan platform** | 2.000 + 2.500 | **Rp 4.500** |

Fee dihitung dari **subtotal produk per order** (setelah diskon kupon produk, sebelum fee pembeli). Pembulatan: **floor ke rupiah utuh** (konsisten dengan `Decimal` existing).

---

## 5. Alur wallet per event

```
CHECKOUT → status PAID
  Pembeli:  ESCROW_HOLD  −buyerHoldAmount
  Teknisi:  (tidak ada perubahan)
  Order:    simpan buyerFeeAmount, sellerFeeAmount, buyerHoldAmount, sellerNetAmount

PROCESSING → SHIPPED → DELIVERED
  (dana tetap di-hold pembeli)

COMPLETED (confirm / auto 3 hari)
  Pembeli:  (hold sudah terpotong — tidak ada refund)
  Teknisi:  EARNING      +sellerNetAmount
  Platform: PLATFORM_FEE ledger internal +buyerFee +sellerFee (lihat §8)

PENJUAL BATAL (PAID/PROCESSING + cancelReason)
  Pembeli:  REFUND       +buyerHoldAmount
  Teknisi:  (tidak ada)
  Order:    CANCELLED, cancelledBy=SELLER

ADMIN REFUND_FULL (komplain)
  Pembeli:  REFUND       +buyerHoldAmount
  Teknisi:  (tidak ada jika belum COMPLETED)
  Order:    REFUNDED

ADMIN REFUND_PARTIAL
  Pembeli:  REFUND       +refundAmount (≤ buyerHoldAmount)
  Teknisi:  EARNING      +(sellerNetAmount adjusted) jika sisa hold direlease
  Order:    COMPLETED atau REFUNDED sesuai nominal

ADMIN REJECTED (komplain ditolak)
  Sama seperti COMPLETED — release neto ke teknisi
```

### 5.1 Idempotensi

Setiap operasi wallet wajib cek ledger existing by `(type, referenceId, wallet.userId)` sebelum menulis — pola yang sudah dipakai di `ensureMarketplaceOrderSettlement` dan konsultasi.

---

## 6. Schema

### 6.1 `Order` — field baru

```prisma
buyerFeeAmount    Decimal  @default(0) @db.Decimal(12, 0)
sellerFeeAmount   Decimal  @default(0) @db.Decimal(12, 0)
buyerHoldAmount   Decimal  @default(0) @db.Decimal(12, 0)  // subtotal + buyerFee
sellerNetAmount   Decimal  @default(0) @db.Decimal(12, 0)  // subtotal - sellerFee
cancelReason      String?  @db.Text
cancelledBy       OrderCancelledBy?
```

```prisma
enum OrderCancelledBy {
  SELLER
  ADMIN
  SYSTEM
}
```

Field fee disimpan saat checkout agar perubahan setting admin tidak mengubah order lama.

### 6.2 `LedgerType` — tambahan (opsional v1)

```prisma
PLATFORM_FEE  // kredit ke wallet sistem/platform (lihat §8)
```

Jika wallet platform belum ada, v1 boleh hanya log `ActivityLog` + tidak memindahkan ke wallet admin.

### 6.3 Platform settings

Ganti `fee_percent` → dua key:

| Key DB | DTO field | Default |
|--------|-----------|---------|
| `buyer_fee_percent` | `buyerFeePercent` | 2.0 |
| `seller_fee_percent` | `sellerFeePercent` | 2.5 |

Migrasi: `fee_percent` lama → salin ke `seller_fee_percent`, set `buyer_fee_percent` = 2.0.

---

## 7. API & lib

### 7.1 `src/lib/marketplace-wallet.ts` — fungsi baru

| Fungsi | Deskripsi |
|--------|-----------|
| `holdBuyerForMarketplace` | Potong saldo + `ESCROW_HOLD` |
| `releaseSellerForMarketplace` | `EARNING` neto ke teknisi |
| `refundBuyerHoldForMarketplace` | `REFUND` full/partial hold |
| `computeMarketplaceFees` | Hitung fee dari subtotal + settings |

**Hapus** pemanggilan `creditSellerForMarketplace` dari checkout. **Pindah** ke `completeMarketplaceOrder`.

### 7.2 Checkout (`marketplace-checkout.ts`)

1. Hitung subtotal per seller-order (existing).
2. `buyerFee = floor(subtotal × buyerFeePercent / 100)`.
3. `sellerFee = floor(subtotal × sellerFeePercent / 100)`.
4. `buyerHoldAmount = subtotal + buyerFee`.
5. `sellerNetAmount = subtotal - sellerFee`.
6. Simpan field di `Order`.
7. `holdBuyerForMarketplace(buyerHoldAmount)` — **bukan** debit PAYMENT + credit EARNING.

Tampilkan breakdown fee di halaman cart sebelum bayar.

### 7.3 Completion (`marketplace-order-confirm.ts`)

Pada `completeMarketplaceOrder`:

1. Guard: belum ada `EARNING` untuk order ini.
2. `releaseSellerForMarketplace(sellerNetAmount)`.
3. Catat platform fee (§8).
4. Set status COMPLETED + timestamp.

### 7.4 Pembatalan penjual (`teknisi/.../orders/[id]/route.ts`)

```ts
z.object({
  action: z.literal('cancel'),
  reason: z.string().min(20).max(500),
})
```

1. Guard status PAID | PROCESSING.
2. `refundBuyerHoldForMarketplace(buyerHoldAmount)`.
3. Restore stock (existing).
4. Set CANCELLED + `cancelReason` + `cancelledBy: SELLER`.
5. **Hapus** `debitSellerForMarketplace` — teknisi belum pernah dikredit.

### 7.5 Komplain resolve (`marketplace-complaint-resolve.ts`)

| Resolution | Wallet |
|------------|--------|
| REFUND_FULL | Refund full `buyerHoldAmount`; order REFUNDED |
| REFUND_PARTIAL | Refund `refundAmount`; release sisa ke teknisi jika applicable |
| REJECTED | `releaseSellerForMarketplace`; order COMPLETED |

Semua asumsikan dana masih di-hold pembeli (komplain terjadi sebelum/selama window COMPLETED).

### 7.6 Wallet API (`/api/wallet`)

Response tambahan:

```ts
{
  balance: number          // saldo tersedia (setelah hold)
  heldBalance: number      // agregat hold order marketplace aktif
  totalBalance: number     // balance + heldBalance
  pendingHolds: Array<{ orderId, orderCode, amount }>
}
```

Agregat: sum `buyerHoldAmount` dari order pembeli dengan status `PAID | PROCESSING | SHIPPED | DISPUTED` yang belum di-refund/released.

---

## 8. Pendapatan platform

**v1 (disarankan):** Catat di `ActivityLog` / `logPaymentEvent` dengan metadata `{ buyerFee, sellerFee, orderId }`. Tidak perlu wallet admin terpisah.

**v1.1 (opsional):** Wallet sistem user `PLATFORM` + ledger `PLATFORM_FEE`.

---

## 9. Admin UI — Keuangan Marketplace

**Lokasi:** `/admin/settings` — panel baru di bawah "Pengaturan Platform"

**Isi:**

| Field | Validasi |
|-------|----------|
| Fee Pembeli (%) | 0–100, step 0.1 |
| Fee Penjual (%) | 0–100, step 0.1 |
| Preview kalkulasi | Read-only: contoh order Rp 100.000 |

Komponen: `AdminMarketplaceFinanceForm.tsx`  
API: extend `PATCH /api/admin/platform/settings`

Hapus field "Fee Platform (%)" tunggal dari `AdminPlatformSettingsForm` — pindah ke panel baru.

---

## 10. UI pembeli & teknisi

### 10.1 `/user/saldo` & komponen wallet

```
┌─────────────────────────────────┐
│ Saldo Tersedia      Rp 642.000  │
│ Ditahan (Escrow)    Rp 102.000  │  ← klik → daftar order
│ ─────────────────────────────── │
│ Total               Rp 744.000  │
└─────────────────────────────────┘
```

Ledger entry hold: *"Dana ditahan — ORD-2026-XXXX"*

### 10.2 `/teknisi/saldo`

- Kartu **Pendapatan Menunggu**: sum `sellerNetAmount` order milik teknisi status PAID/PROCESSING/SHIPPED/DISPUTED (belum COMPLETED).
- Ledger EARNING: *"Penjualan ORD-xxx (setelah fee platform 2,5%)"*

### 10.3 Cart checkout

Tampilkan baris:

```
Subtotal produk     Rp 100.000
Fee platform        Rp   2.000
─────────────────────────────
Total dibayar       Rp 102.000
```

### 10.4 Form pembatalan penjual

Modal di `/teknisi/pesanan`:

- Textarea alasan (min. 20, max. 500)
- Peringatan: *"Dana pembeli akan dikembalikan sepenuhnya"*
- Tombol konfirmasi destructive

---

## 11. Integrasi dengan order completion spec

| Fitur existing | Perubahan |
|----------------|-----------|
| Confirm receipt | Trigger `releaseSellerForMarketplace` |
| Auto-complete 3 hari | Sama |
| Komplain → DISPUTED | Hold tetap; blok release |
| Admin resolve | Sesuai tabel §7.5 |
| Seller manual COMPLETED | Tetap dihapus (spec completion) |

---

## 12. Edge cases

| Situasi | Perlakuan |
|---------|-----------|
| Order lama sudah ada EARNING di checkout | Script backfill: flag `legacySettled`; jangan double-release |
| Komplain saat auto-complete cron | Cek komplain aktif sebelum release |
| `buyerHoldAmount` > saldo saat checkout | Tolak — `INSUFFICIENT_BALANCE` (existing) |
| Diskon kupon 100% | Fee dihitung dari subtotal setelah diskon; hold minimal 0 + fee pembeli |
| Double complete | Idempotent — skip jika EARNING exists |
| Settings fee berubah | Order baru pakai settings baru; order lama pakai field tersimpan |

### 12.1 Migrasi order aktif

Order dengan status PAID+ yang sudah punya EARNING:

1. Tidak reverse wallet (risiko tinggi).
2. Tandai `settlementVersion: 1` (legacy) vs `2` (escrow).
3. Order baru selalu v2.

---

## 13. Testing

| ID | Skenario |
|----|----------|
| FT-ESC-001 | Checkout → pembeli hold, teknisi saldo tidak berubah |
| FT-ESC-002 | COMPLETED → teknisi +sellerNetAmount, ledger EARNING |
| FT-ESC-003 | Fee pembeli tampil di cart & hold amount benar |
| FT-ESC-004 | Penjual batal tanpa alasan → ditolak |
| FT-ESC-005 | Penjual batal + alasan → refund full hold |
| FT-ESC-006 | Admin refund full komplain → refund full hold |
| FT-ESC-007 | Admin reject komplain → release ke teknisi |
| FT-ESC-008 | Wallet API breakdown heldBalance benar |
| FT-ESC-009 | Idempotent double complete |

---

## 14. File terdampak

| Area | File |
|------|------|
| Schema | `prisma/schema.prisma`, migrasi baru |
| Wallet lib | `marketplace-wallet.ts` |
| Checkout | `marketplace-checkout.ts`, `cart/page.tsx` |
| Completion | `marketplace-order-confirm.ts` |
| Cancel | `teknisi/marketplace/orders/[id]/route.ts`, UI pesanan |
| Complaint | `marketplace-complaint-resolve.ts` |
| Settings | `platform-settings-shared.ts`, `platform-settings.ts`, admin forms |
| Wallet API/UI | `/api/wallet`, `wallet-transaction-history.tsx`, saldo views |
| Serializer | `marketplace-order-serializer.ts` — expose fee fields ke admin |

---

## 15. Urutan implementasi

1. Schema + platform settings (dual fee)
2. `marketplace-wallet` hold/release/refund
3. Ubah checkout (hold only) + cart UI fee
4. Ubah completion + complaint resolve
5. Ubah cancel penjual + form alasan
6. Wallet API breakdown + UI saldo
7. Admin Keuangan Marketplace form
8. Backfill flag legacy + tests

---

## 16. Self-review checklist

- [x] Tidak ada placeholder TBD pada keputusan bisnis
- [x] Konsisten: teknisi hanya terima saat COMPLETED
- [x] Konsisten: hold = subtotal + buyer fee; release = subtotal − seller fee
- [x] Dual fee structure jelas (buyer added, seller deducted)
- [x] Amandemen spec completion untuk escrow terdokumentasi
- [x] Pembatalan penjual tidak perlu debitSeller (belum pernah dikredit)
- [x] Admin fee location: Settings → Keuangan Marketplace
- [x] Legacy order migration strategy defined
