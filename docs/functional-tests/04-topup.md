# Topup Services

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Topup adalah katalog produk digital (pulsa, paket data, e-money, voucher game) yang dijual platform. Setiap produk punya beberapa denominasi (mis. 10K, 25K, 50K). Pembayaran selalu via saldo wallet IndoTeknizi. Hasil topup biasanya berupa kode produk / serial yang ditampilkan ke USER.

State order: `PENDING → SUCCESS` (atau `FAILED`). USER bisa lihat history topup di `/topup/orders` atau `/user/orders` (tergantung implementasi).

## Cakupan Test

- Core Flow (DetailedTestCase): browse katalog, pilih denominasi, checkout via wallet, order SUCCESS dengan kode produk, lihat history.
- Edge Flow (GWTChecklist): denominasi tidak tersedia, saldo kurang, payload kosong, akses unauthenticated.
- RBAC: ADMIN tidak boleh checkout topup atas nama USER (read-only di sisi admin).

## Detailed Test Cases

### FT-TOP-001 — Browse katalog topup
- **Role**: USER (atau Guest read-only)
- **Priority**: P0
- **Preconditions**:
  - Database ter-seed (lihat `seedTopupCatalog`)
  - Opsional: login sebagai `siti@gmail.com` untuk lihat checkout button
- **Steps**:
  1. Buka `/topup`
  2. Pilih kategori (mis. Pulsa, Game)
  3. Pilih provider (mis. Telkomsel, Mobile Legends)
- **Expected Result**:
  - Daftar `TopupCatalogProduct` aktif tampil
  - Setiap produk menampilkan denominasi dengan harga jual
- **Postconditions**: tidak ada
- **References**: `src/contexts/topup-catalog-context.tsx`, `src/app/api/topup/catalog/...`, `prisma/seed-topup-catalog.ts`

### FT-TOP-002 — Pilih denominasi & isi nomor tujuan
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Denominasi topup tersedia
- **Test Data**:
  - Kategori: Pulsa Telkomsel
  - Denominasi: Rp 25.000
  - Nomor tujuan: `0812-3456-7890`
- **Steps**:
  1. Pilih produk Telkomsel
  2. Klik denominasi 25K
  3. Masukkan nomor tujuan
  4. Lanjut ke checkout
- **Expected Result**:
  - Form lolos validasi (nomor format MSISDN)
  - Halaman konfirmasi tampil dengan ringkasan harga
- **Postconditions**: state TopupContext memuat draft order
- **References**: `src/contexts/topup-context.tsx`

### FT-TOP-003 — Checkout topup via wallet
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login `siti@gmail.com`, saldo ≥ Rp 30.000
  - Draft topup siap (FT-TOP-002)
- **Steps**:
  1. Klik "Bayar dengan Saldo"
  2. Konfirmasi
- **Expected Result**:
  - POST ke `/api/topup/checkout` mengembalikan `{ success: true, data: { orderId, status: 'PENDING' } }`
  - TopupOrder status `PENDING` tercipta
  - Saldo USER langsung berkurang
  - WalletLedger entry `DEBIT`
- **Postconditions**:
  - Worker eksternal akan memproses → status menjadi `SUCCESS` saat provider mengembalikan kode
- **References**: `src/lib/topup-*.ts`, `src/app/api/topup/checkout/route.ts`

### FT-TOP-004 — Order SUCCESS dengan kode produk tampil
- **Role**: USER (sistem)
- **Priority**: P0
- **Preconditions**:
  - TopupOrder status `PENDING` ada (mis. milik `siti@gmail.com` hasil FT-TOP-003)
  - Provider mock mengembalikan kode (di dev)
- **Steps**:
  1. Tunggu polling/worker (atau trigger manual)
  2. Buka detail order
- **Expected Result**:
  - Status `PENDING → SUCCESS`
  - Field `code` (atau serial) terisi
  - Kode tampil di UI dengan tombol Copy
  - Notifikasi "Topup berhasil" muncul
- **Postconditions**:
  - History menampilkan order dengan kode lengkap
- **References**: `src/lib/topup-*.ts` (worker)

## Negative Scenarios (GWTChecklist)

### FT-TOP-101 — Checkout topup tanpa autentikasi ditolak [NEGATIVE]
- **Given**: Tidak ada session aktif
- **When**: POST `/api/topup/checkout` dengan payload valid
- **Then**: Response HTTP 401 `{ success: false, error: "Unauthorized" }`, tidak ada TopupOrder tercipta

### FT-TOP-102 — Checkout dengan denominationId tidak ada ditolak [NEGATIVE]
- **Given**: USER `siti@gmail.com` login
- **When**: POST `/api/topup/checkout` dengan `denominationId: "tidak-ada"`
- **Then**: Response HTTP 404 `{ success: false, error: "Denominasi tidak ditemukan" }`

### FT-TOP-103 — Nomor tujuan format invalid ditolak [NEGATIVE]
- **Given**: USER login, denominasi pulsa Telkomsel dipilih
- **When**: USER submit nomor tujuan `"abc-123"` (gagal regex MSISDN)
- **Then**: Validasi Zod gagal, response `{ success: false, error: <pesan> }` HTTP 400

### FT-TOP-104 — Saldo wallet kurang untuk topup ditolak [NEGATIVE]
- **Given**: USER `dewi` (saldo Rp 100.000)
- **When**: USER checkout topup pulsa Rp 200.000
- **Then**: Sistem menolak `{ success: false, error: "Saldo tidak cukup" }` HTTP 400

## Edge Cases (GWTChecklist)

### FT-TOP-201 — Provider topup return error → order FAILED + auto refund [EDGE]
- **Given**: TopupOrder status `PENDING`; provider mock di-set return error
- **When**: Worker memproses order
- **Then**: Status `PENDING → FAILED`, WalletLedger `REFUND` untuk USER sebesar harga, saldo kembali, notifikasi USER

## RBAC Enforcement

### FT-TOP-901 — ADMIN tidak boleh checkout topup atas nama USER [RBAC]
- **Given**: ADMIN `admin@indoteknizi.com` login
- **When**: ADMIN POST `/api/topup/checkout` dengan `userId: <user1.id>` di payload
- **Then**: Endpoint tidak menerima parameter userId (selalu pakai session user); jika dipaksa, parameter di-ignore dan order tercipta atas nama ADMIN sendiri (atau ditolak HTTP 403, sesuai implementasi)

## Catatan QA

- Seed katalog: `prisma/seed-topup-catalog.ts`
- Konteks frontend: `src/contexts/topup-context.tsx`, `src/contexts/topup-catalog-context.tsx`
- API: `src/app/api/topup/catalog/`, `src/app/api/topup/checkout/`
- Models: `TopupCatalogProduct`, `TopupDenomination`, `TopupOrder` di `prisma/schema.prisma`
