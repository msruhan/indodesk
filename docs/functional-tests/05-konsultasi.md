# Konsultasi

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Konsultasi adalah sesi tanya-jawab real-time antara USER dan TEKNISI yang difasilitasi platform. USER booking sesi (memilih layanan + harga), bayar via wallet, TEKNISI menerima request lalu sesi berlangsung di chat / video / remote. Setelah sesi `COMPLETED`, dana otomatis settle ke wallet TEKNISI dan USER bisa memberikan review.

State machine: `PENDING → ACTIVE → AWAITING_CONFIRMATION → COMPLETED` (payout saat user konfirmasi atau auto 48 jam; atau `CANCELLED` di jalur error).

## Cakupan Test

- Core Flow (DetailedTestCase): booking sesi, payment via wallet, TEKNISI accept, sesi berlangsung, teknisi mark-done, USER konfirmasi selesai (atau auto 48 jam), USER beri review.
- Edge Flow (GWTChecklist): pembatalan setelah TEKNISI accept (refund utuh), TEKNISI reject sebelum start, sesi expired.
- RBAC: USER tidak boleh start/end sesi orang lain.

## Detailed Test Cases

### FT-KON-001 — USER booking konsultasi
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - TEKNISI `ahmad@indoteknizi.com` punya `consultationServices` di profil seed (Rp 50.000)
- **Test Data**:
  - Service: `Konsultasi Unlock`
  - Price: Rp 50.000
- **Steps**:
  1. Buka profil `ahmad` (`/teknisi/[slug]`)
  2. Klik "Booking Konsultasi"
  3. Pilih service
  4. Submit booking
- **Expected Result**:
  - KonsultasiSession baru tercipta dengan status `PENDING`
  - `userId`, `teknisiId`, `service`, `price` terisi
  - Notifikasi platform untuk TEKNISI
- **Postconditions**:
  - Booking tampil di `/user/konsultasi` (USER) dan `/teknisi/konsultasi` (TEKNISI)
- **References**: `src/lib/konsultasi-*.ts`, `src/app/api/konsultasi/book/route.ts`

### FT-KON-002 — Pembayaran konsultasi via wallet
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - KonsultasiSession status `PENDING` ada (FT-KON-001)
  - Saldo USER ≥ Rp 50.000
- **Steps**:
  1. Buka detail booking
  2. Klik "Bayar dengan Saldo"
  3. Konfirmasi
- **Expected Result**:
  - Saldo USER berkurang Rp 50.000
  - Dana di-hold di escrow (WalletLedger HOLD untuk TEKNISI)
  - Status sesi tetap `PENDING` menunggu accept TEKNISI
- **Postconditions**:
  - Sesi siap diterima TEKNISI
- **References**: modul wallet konsultasi

### FT-KON-003 — TEKNISI accept dan sesi ACTIVE
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
  - Booking PENDING dari USER
- **Steps**:
  1. Buka `/teknisi/konsultasi`
  2. Klik booking PENDING
  3. Klik "Terima"
- **Expected Result**:
  - Status `PENDING → ACTIVE`
  - `startedAt` terisi
  - Channel chat/sesi terbuka
  - Notifikasi USER bahwa sesi dimulai
- **Postconditions**:
  - USER & TEKNISI bisa berkomunikasi di sesi
- **References**: `src/lib/konsultasi-*.ts`, `src/app/api/teknisi/konsultasi/...`

### FT-KON-004 — TEKNISI mark-done (tanpa payout)
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login sebagai teknisi
  - Sesi status `ACTIVE`
- **Steps**:
  1. Buka `/teknisi/konsultasi`
  2. Klik **Selesai melayani**
  3. Konfirmasi dialog
- **Expected Result**:
  - Status `ACTIVE → AWAITING_CONFIRMATION`
  - `teknisiMarkedDoneAt` dan `confirmDeadlineAt` (+48 jam) terisi
  - **Tidak ada** payout / WalletLedger EARNING teknisi
  - User menerima notifikasi konfirmasi

### FT-KON-004b — USER confirm-complete → payout
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Sesi `AWAITING_CONFIRMATION` (setelah FT-KON-004)
- **Steps**:
  1. Buka `/user/konsultasi`
  2. Klik **Konfirmasi selesai**
  3. Konfirmasi dialog
- **Expected Result**:
  - Status `COMPLETED`, `endedAt` terisi
  - WalletLedger EARNING teknisi
  - User dapat beri rating

### FT-KON-004c — Auto-complete setelah deadline
- **Role**: SYSTEM (cron)
- **Priority**: P1
- **Preconditions**:
  - Sesi `AWAITING_CONFIRMATION` dengan `confirmDeadlineAt` lewat
- **Steps**:
  1. Panggil `POST /api/cron/konsultasi-confirm-deadlines`
- **Expected Result**:
  - Status `COMPLETED` + payout teknisi (sama seperti FT-KON-004b)

### FT-KON-005 — USER beri review setelah COMPLETED
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Sesi status `COMPLETED` belum direview
- **Test Data**:
  - Rating: 5
  - Review: `Diagnosisnya jelas, unlock berhasil cepat.`
  - Tag: `Problem solved`
- **Steps**:
  1. Buka detail sesi COMPLETED
  2. Klik "Beri Ulasan"
  3. Isi rating + review
  4. Submit
- **Expected Result**:
  - Field `rating` dan `review` di KonsultasiSession terisi
  - TeknisiReview tercipta (atau setara di model lain)
  - Rating profil TEKNISI di-recompute
- **Postconditions**:
  - Tombol review berubah jadi "Sudah direview"
- **References**: `src/lib/konsultasi-*.ts`, model `TeknisiReview` di schema

## Negative Scenarios (GWTChecklist)

### FT-KON-101 — Booking tanpa autentikasi ditolak [NEGATIVE]
- **Given**: Tidak ada session aktif
- **When**: POST `/api/konsultasi/book` dengan payload valid
- **Then**: Response HTTP 401, sesi tidak tercipta

### FT-KON-102 — Booking dengan teknisiId tidak ada ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/konsultasi/book` dengan `teknisiId: "tidak-ada"`
- **Then**: Response HTTP 404 `{ success: false, error: "Teknisi tidak ditemukan" }`

### FT-KON-103 — Booking saat saldo wallet kurang ditolak [NEGATIVE]
- **Given**: USER `dewi` saldo Rp 100.000; service Rp 200.000
- **When**: USER booking dan klik bayar
- **Then**: Response `{ success: false, error: "Saldo tidak cukup" }` HTTP 400, sesi tetap PENDING tanpa pembayaran

## Edge Cases (GWTChecklist)

### FT-KON-201 — Pembatalan setelah TEKNISI accept → refund utuh [EDGE]
- **Given**: KonsultasiSession status `ACTIVE` (sudah dibayar, TEKNISI accept) namun belum dimulai eksekusi
- **When**: USER atau TEKNISI klik "Batalkan Sesi"
- **Then**: Status `ACTIVE → CANCELLED`, WalletLedger `REFUND` untuk USER sebesar `price` utuh (tanpa fee), saldo TEKNISI tidak bertambah

## RBAC Enforcement

### FT-KON-901 — TEKNISI accept sesi yang ditugaskan ke teknisi lain ditolak [RBAC]
- **Given**: KonsultasiSession PENDING ditugaskan ke `ahmad`
- **When**: TEKNISI `budi` login dan mencoba accept sesi tersebut
- **Then**: Response HTTP 403, status sesi tidak berubah

## Catatan QA

- Implementasi konsultasi: `src/lib/konsultasi-*.ts`
- API USER: `src/app/api/konsultasi/...`
- API TEKNISI: `src/app/api/teknisi/konsultasi/...`
- Model: `KonsultasiSession`, `TeknisiReview` di `prisma/schema.prisma`
- Wallet integration: WalletLedger HOLD/EARNING saat sesi PENDING/COMPLETED
