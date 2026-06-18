# Rekber (Escrow)

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Rekber (rekening bersama) adalah layanan escrow internal IndoTeknizi: dana USER ditahan oleh sistem hingga layanan/transaksi diluar marketplace selesai. State utama: `HELD → RELEASED` (rilis ke seller) atau `HELD → REFUNDED` (kembali ke buyer). ADMIN berperan sebagai arbiter saat dispute.

Setiap pembuatan rekber memotong fee platform (mis. 1%). Fee tetap tersimpan meski di-refund (sesuai kebijakan platform — verifikasi di kode).

## Cakupan Test

- Core Flow (DetailedTestCase): pembuatan rekber HELD, release dana ke seller, refund ke buyer, dispute oleh USER.
- Edge Flow (GWTChecklist): release pada rekber REFUNDED ditolak, double-release, expiry rekber HELD.
- RBAC: USER tidak boleh release/refund rekber milik orang lain.

## Detailed Test Cases

### FT-RKB-001 — Pembuatan rekber baru (HELD)
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `rudi@gmail.com` (top-up saldo dulu jika kurang — minimal Rp 7.500.000)
  - Seller `budi@indoteknizi.com` aktif
- **Test Data**:
  - `sellerEmail`: `budi@indoteknizi.com`
  - `amount`: 7200000
  - `description`: `Pembelian Samsung S21 Ultra via rekber`
- **Steps**:
  1. Buka `/rekber/buat` atau halaman rekber
  2. Pilih seller (autocomplete email)
  3. Isi amount + deskripsi
  4. Klik "Buat Rekber"
  5. Konfirmasi pembayaran via wallet
- **Expected Result**:
  - RekberTransaction baru tercipta dengan status `HELD`, fee 1% dari amount
  - Saldo USER berkurang sebesar `amount + fee`
  - WalletLedger entry `DEBIT` USER, `HOLD` ke escrow
  - `heldAt` terisi
- **Postconditions**:
  - Rekber tampil di `/user/rekber` dan dashboard ADMIN
- **References**: `src/lib/rekber-*.ts`, `src/app/api/rekber/...`, `prisma/schema.prisma` (RekberTransaction)

### FT-RKB-002 — Release dana ke seller (oleh USER, layanan selesai)
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `rudi@gmail.com` (buyer dari rekber)
  - Rekber status `HELD` milik USER (mis. `RKB-2026-000001` atau hasil FT-RKB-001)
- **Steps**:
  1. Buka `/user/rekber`
  2. Klik rekber HELD
  3. Klik "Release ke Seller"
  4. Konfirmasi dialog
- **Expected Result**:
  - Status `HELD → RELEASED`, `releasedAt` terisi
  - WalletLedger `EARNING` dibuat untuk seller sebesar `amount` (fee tetap di platform)
  - Saldo seller bertambah
  - Notifikasi platform untuk seller
- **Postconditions**:
  - Rekber tidak bisa di-refund lagi
- **References**: `src/lib/rekber-*.ts`

### FT-RKB-003 — Refund dana ke buyer (cancel by ADMIN atau auto-expiry)
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**:
  - Rekber HELD aktif
  - Login sebagai `admin@indoteknizi.com`
- **Steps**:
  1. Buka `/admin/rekber`
  2. Pilih rekber yang akan di-refund
  3. Klik "Refund"
  4. Isi alasan refund
  5. Konfirmasi
- **Expected Result**:
  - Status `HELD → REFUNDED`, `refundedAt` terisi
  - Saldo buyer dikembalikan sebesar `amount` (fee biasanya tetap dipotong, verifikasi di kode)
  - WalletLedger `REFUND` entry tercipta
  - Notifikasi untuk buyer dan seller
- **Postconditions**:
  - Rekber tidak bisa direlease lagi
- **References**: `src/app/api/admin/rekber/...`

### FT-RKB-004 — Dispute oleh USER (eskalasi ke ADMIN)
- **Role**: USER → ADMIN
- **Priority**: P1
- **Preconditions**:
  - Rekber status `HELD`
  - USER login (buyer dari rekber)
- **Test Data**:
  - Alasan dispute: `Layanan tidak sesuai deskripsi.`
  - Bukti: screenshot/foto (opsional)
- **Steps**:
  1. Buka detail rekber
  2. Klik "Ajukan Dispute"
  3. Isi alasan dispute + lampiran (jika ada)
  4. Submit
- **Expected Result**:
  - Rekber masuk antrian review ADMIN dengan flag dispute
  - ActivityLog entry `rekber.dispute.opened`
  - Notifikasi ke ADMIN
- **Postconditions**:
  - Rekber dilock dari aksi USER lain hingga ADMIN memutuskan release/refund
- **References**: `src/lib/rekber-*.ts`, dashboard ADMIN

## Negative Scenarios (GWTChecklist)

### FT-RKB-101 — Buat rekber tanpa autentikasi ditolak [NEGATIVE]
- **Given**: Tidak ada session aktif
- **When**: POST `/api/rekber` dengan payload valid
- **Then**: Response HTTP 401 `{ success: false, error: "Unauthorized" }`, tidak ada RekberTransaction tercipta

### FT-RKB-102 — Buat rekber dengan amount ≤ 0 ditolak [NEGATIVE]
- **Given**: USER `rudi@gmail.com` login
- **When**: POST `/api/rekber` dengan `amount: 0` atau `amount: -50000`
- **Then**: Validasi Zod gagal, response `{ success: false, error: <pesan> }` HTTP 400

### FT-RKB-103 — Buat rekber dengan saldo wallet kurang ditolak [NEGATIVE]
- **Given**: USER `dewi@gmail.com` login (saldo Rp 100.000)
- **When**: USER membuat rekber dengan amount Rp 5.000.000
- **Then**: Sistem menolak `{ success: false, error: "Saldo tidak cukup" }` HTTP 400, rekber tidak tercipta, saldo tidak berubah

### FT-RKB-104 — Buat rekber dengan seller email tidak terdaftar ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/rekber` dengan `sellerEmail: "tidak-ada@gmail.com"`
- **Then**: Response HTTP 404 `{ success: false, error: "Seller tidak ditemukan" }`

## Edge Cases (GWTChecklist)

### FT-RKB-201 — Release rekber yang sudah REFUNDED ditolak [EDGE]
- **Given**: RekberTransaction dengan status `REFUNDED`
- **When**: USER atau ADMIN klik "Release" pada rekber tersebut
- **Then**: Sistem menolak HTTP 409 `{ success: false, error: "State tidak valid", code: "INVALID_STATE" }`, status tetap REFUNDED, tidak ada double-spend

### FT-RKB-202 — Release rekber yang sudah RELEASED (double release) ditolak [EDGE]
- **Given**: RekberTransaction status `RELEASED`
- **When**: USER mencoba klik "Release" lagi
- **Then**: Tombol disabled di UI; jika request dipaksakan via API → HTTP 409, saldo seller tidak berubah

## RBAC Enforcement

### FT-RKB-901 — USER release rekber bukan miliknya ditolak [RBAC]
- **Given**: Rekber `RKB-2026-000001` milik `rudi` (buyerId = user2.id) status HELD
- **When**: USER `siti@gmail.com` (bukan buyer) mencoba release rekber tersebut via API
- **Then**: Response HTTP 403, status rekber tidak berubah

## Catatan QA

- Implementasi: cari modul rekber di `src/lib/` (mis. `src/lib/rekber-*.ts`)
- Endpoint USER: `src/app/api/rekber/...`
- Endpoint ADMIN: `src/app/api/admin/rekber/...`
- State machine: HELD → RELEASED | REFUNDED (terminal states)
- Fee: konstanta di `src/lib/rekber-config.ts` atau setara
