# Remote Assistance

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Remote Assistance adalah layanan bantuan jarak jauh: USER mengirim Remote ID (mirip AnyDesk/TeamViewer) ke TEKNISI yang menerima koneksi via aplikasi IndoDesk. TEKNISI mengontrol perangkat USER untuk troubleshoot. State sesi: `WAITING → IN_PROGRESS → COMPLETED` (atau `CANCELLED`).

USER perlu mengunduh client IndoDesk (file binary) dari halaman remote sebelum memulai sesi.

## Cakupan Test

- Core Flow (DetailedTestCase): USER request remote, download IndoDesk client, TEKNISI accept, sesi berlangsung, completion.
- Edge Flow (GWTChecklist): TEKNISI tolak, sesi timeout, remote ID format invalid.
- RBAC: USER hanya bisa lihat sesi miliknya, TEKNISI hanya yang ditugaskan.

## Detailed Test Cases

### FT-REM-001 — USER request remote session
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - TEKNISI target tersedia (`ahmad`)
- **Test Data**:
  - `remoteId`: `987 654 321` (format mengikuti IndoDesk)
  - `description`: `iPhone stuck di logo Apple setelah update iOS. Butuh restore via remote.`
  - `platform`: `Windows 11`
- **Steps**:
  1. Buka `/remote`
  2. Klik "Request Remote"
  3. Pilih TEKNISI tujuan
  4. Isi Remote ID + deskripsi + platform
  5. Submit
- **Expected Result**:
  - RemoteSession baru status `WAITING`
  - Notifikasi platform ke TEKNISI tujuan
- **Postconditions**:
  - Sesi tampil di `/user/remote` dan `/teknisi/remote`
- **References**: `src/lib/remote-*.ts`, `src/app/api/remote/...`, model `RemoteSession`

### FT-REM-002 — Download IndoDesk client
- **Role**: USER (atau Guest)
- **Priority**: P1
- **Preconditions**:
  - Halaman remote dibuka (Guest atau USER `siti@gmail.com`)
- **Test Data**: tidak ada
- **Steps**:
  1. Buka `/remote`
  2. Klik tombol "Download IndoDesk"
  3. Pilih platform (Windows / macOS / Linux)
- **Expected Result**:
  - File binary terunduh dari R2 atau redirect ke URL download
  - `IndodeskDownload` mencatat statistik unduhan (counter +1)
- **Postconditions**:
  - File ada di komputer USER, siap dijalankan
- **References**: `src/lib/indodesk-*.ts`, model `IndodeskDownload`, R2 storage

### FT-REM-003 — TEKNISI accept dan sesi IN_PROGRESS
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
  - Ada sesi `WAITING` ditugaskan ke TEKNISI
- **Steps**:
  1. Buka `/teknisi/remote`
  2. Klik sesi WAITING
  3. Klik "Terima"
- **Expected Result**:
  - Status `WAITING → IN_PROGRESS`, `acceptedAt` terisi
  - TEKNISI memasukkan Remote ID di IndoDesk client untuk koneksi (di luar platform — manual)
  - Notifikasi USER bahwa sesi dimulai
- **Postconditions**:
  - Sesi aktif sampai TEKNISI mark COMPLETED
- **References**: `src/app/api/teknisi/remote/...`

### FT-REM-004 — TEKNISI mark COMPLETED
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `ahmad@indoteknizi.com`
  - Sesi status `IN_PROGRESS`
- **Steps**:
  1. Buka detail sesi
  2. Klik "Selesaikan"
  3. Konfirmasi
- **Expected Result**:
  - Status `IN_PROGRESS → COMPLETED`, `completedAt` terisi
  - Jika layanan berbayar → settlement ke wallet TEKNISI
  - Notifikasi USER
- **Postconditions**:
  - Sesi tampil di "Riwayat Remote"
- **References**: `src/lib/remote-*.ts`

## Negative Scenarios (GWTChecklist)

### FT-REM-101 — Request remote tanpa autentikasi ditolak [NEGATIVE]
- **Given**: Tidak ada session aktif
- **When**: POST `/api/remote/request` dengan payload valid
- **Then**: Response HTTP 401, tidak ada RemoteSession tercipta

### FT-REM-102 — Remote ID format invalid ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/remote/request` dengan `remoteId: ""` (kosong)
- **Then**: Validasi Zod gagal, response `{ success: false, error: <pesan> }` HTTP 400

### FT-REM-103 — Description kosong ditolak [NEGATIVE]
- **Given**: USER login
- **When**: USER submit form remote tanpa mengisi description
- **Then**: Validasi gagal di UI dan/atau di API, request tidak diproses

## Edge Cases (GWTChecklist)

### FT-REM-201 — TEKNISI reject remote request [EDGE]
- **Given**: RemoteSession status `WAITING` ditugaskan ke `ahmad`
- **When**: TEKNISI klik "Tolak"
- **Then**: Status `WAITING → CANCELLED`, alasan disimpan, USER mendapat notifikasi, dana (jika ada) di-refund

## RBAC Enforcement

### FT-REM-901 — USER lain mengakses RemoteSession bukan miliknya ditolak [RBAC]
- **Given**: RemoteSession milik `siti` (userId = user1.id)
- **When**: USER `rudi` mencoba GET / PATCH sesi tersebut via API
- **Then**: Response HTTP 403, sesi tidak terbaca

## Catatan QA

- Implementasi: `src/lib/remote-*.ts`, `src/lib/indodesk-*.ts`
- API: `src/app/api/remote/...`, `src/app/api/teknisi/remote/...`
- Model: `RemoteSession`, `IndodeskDownload` di `prisma/schema.prisma`
- Seed sample: 3 RemoteSession (WAITING, IN_PROGRESS, COMPLETED) di `prisma/seed.ts`
