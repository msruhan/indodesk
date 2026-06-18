# Inspection Services

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Inspection adalah layanan pre-purchase check untuk perangkat (HP / laptop) yang dilakukan secara online (via foto/video) atau offline (teknisi datang ke alamat USER). Setelah inspeksi selesai, TEKNISI generate report PDF (via PDFKit) dan sertifikat dengan QR code yang bisa diunduh USER.

State machine: `PENDING_ASSIGNMENT → ASSIGNED → IN_PROGRESS → REPORT_SUBMITTED → COMPLETED` (atau `CANCELLED`).

## Cakupan Test

- Core Flow (DetailedTestCase): request inspeksi online, request inspeksi offline, ADMIN/sistem assign teknisi, TEKNISI submit report PDF, USER unduh sertifikat.
- Edge Flow (GWTChecklist): tidak ada teknisi tersedia, alamat kosong (offline), jadwal masa lalu, kategori tidak didukung.
- RBAC: TEKNISI hanya akses inspeksi yang ditugaskan.

## Detailed Test Cases

### FT-INS-001 — USER request inspeksi ONLINE
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `dewi@gmail.com`
  - Saldo cukup untuk biaya inspeksi
- **Test Data**:
  - `mode`: `ONLINE`
  - `deviceCategory`: `HANDPHONE`
  - `deviceBrand`: `iPhone`
  - `deviceModel`: `13 Pro Max`
  - `notes`: `Cek baterai dan kondisi screen`
- **Steps**:
  1. Buka `/inspeksi`
  2. Pilih mode `Online`
  3. Isi data perangkat + catatan
  4. Konfirmasi pembayaran via wallet
- **Expected Result**:
  - InspectionOrder baru status `PENDING_ASSIGNMENT`
  - Saldo USER berkurang
  - Notifikasi ADMIN/sistem untuk penugasan
- **Postconditions**:
  - Inspection tampil di `/user/inspeksi`
- **References**: `src/lib/inspection-*.ts`, `src/app/api/inspection/request/route.ts`, model `InspectionOrder`

### FT-INS-002 — USER request inspeksi OFFLINE (kunjungan teknisi)
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login `dewi@gmail.com`, saldo cukup
- **Test Data**:
  - `mode`: `OFFLINE`
  - `deviceCategory`: `LAPTOP`
  - `address`: `Jl. Merdeka No. 45, Bandung`
  - `scheduledAt`: tanggal/waktu di masa depan (mis. hari berikutnya 14:00)
- **Steps**:
  1. Buka `/inspeksi`
  2. Pilih mode `Offline`
  3. Isi alamat + tanggal & waktu kunjungan
  4. Konfirmasi
- **Expected Result**:
  - InspectionOrder status `PENDING_ASSIGNMENT` dengan field alamat & jadwal
  - Validasi: `scheduledAt` > now, alamat tidak kosong
- **Postconditions**:
  - Order siap di-assign teknisi area pelayanan terdekat
- **References**: `src/app/api/inspection/request/route.ts`

### FT-INS-003 — Penugasan teknisi otomatis / manual ADMIN
- **Role**: ADMIN (atau sistem)
- **Priority**: P0
- **Preconditions**:
  - InspectionOrder status `PENDING_ASSIGNMENT`
  - Teknisi tersedia (mis. `ahmad`) di area pelayanan
- **Steps**:
  1. Login `admin@indoteknizi.com`
  2. Buka `/admin/inspeksi`
  3. Klik order PENDING
  4. Pilih teknisi → klik "Assign"
- **Expected Result**:
  - Status `PENDING_ASSIGNMENT → ASSIGNED`
  - Field `teknisiId` terisi
  - Notifikasi ke teknisi
- **Postconditions**:
  - Order tampil di `/teknisi/inspeksi`
- **References**: `src/app/api/admin/inspection/...`, `src/app/api/teknisi/inspection/...`

### FT-INS-004 — TEKNISI accept & start inspeksi
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
  - Order status `ASSIGNED`
- **Steps**:
  1. Buka `/teknisi/inspeksi`
  2. Klik order
  3. Klik "Mulai Inspeksi"
- **Expected Result**:
  - Status `ASSIGNED → IN_PROGRESS`
  - `startedAt` terisi
- **Postconditions**:
  - TEKNISI bisa upload foto + isi checklist hasil inspeksi
- **References**: `src/app/api/teknisi/inspection/[id]/start/...`

### FT-INS-005 — TEKNISI submit report dengan generate PDF
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `ahmad@indoteknizi.com`
  - InspectionOrder status `IN_PROGRESS`
  - PDFKit terpasang
- **Test Data**:
  - Checklist: ≥ 10 item kondisi (battery health, screen, charging port, dll.)
  - Foto bukti: ≥ 3 foto via R2
  - Kesimpulan: `Layak beli, kondisi 90%`
- **Steps**:
  1. Buka detail inspection IN_PROGRESS
  2. Isi checklist + upload foto
  3. Tulis kesimpulan
  4. Klik "Submit Report"
- **Expected Result**:
  - InspectionReport tersimpan
  - PDF report ter-generate via PDFKit dan diupload ke R2
  - Status `IN_PROGRESS → REPORT_SUBMITTED`
  - `completedAt` terisi
  - Settlement ke wallet teknisi
  - Notifikasi USER report siap
- **Postconditions**:
  - USER bisa unduh report dan sertifikat
- **References**: `src/lib/inspection-*.ts` (PDFKit generation), model `InspectionReport`

### FT-INS-006 — USER unduh sertifikat & report PDF
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Login `dewi@gmail.com`
  - InspectionOrder status `REPORT_SUBMITTED` atau `COMPLETED`
- **Steps**:
  1. Buka `/user/inspeksi/[id]`
  2. Klik "Download Report PDF"
  3. Klik "Download Sertifikat"
- **Expected Result**:
  - File PDF terunduh dari R2
  - Sertifikat memuat QR code yang berisi link verifikasi inspeksi (URL public)
- **Postconditions**:
  - Inspection bisa di-mark COMPLETED oleh USER atau auto setelah X hari
- **References**: `src/lib/inspection-*.ts` (PDF + QR), R2 storage

## Negative Scenarios (GWTChecklist)

### FT-INS-101 — Inspeksi OFFLINE dengan alamat kosong ditolak [NEGATIVE]
- **Given**: USER `dewi@gmail.com` login
- **When**: POST `/api/inspection/request` dengan `mode: "OFFLINE"` dan `address: ""`
- **Then**: Validasi Zod gagal, response `{ success: false, error: <pesan> }` HTTP 400, order tidak tercipta

### FT-INS-102 — Jadwal inspeksi di masa lalu ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/inspection/request` dengan `scheduledAt` < now
- **Then**: Validasi gagal, response HTTP 400 `{ success: false, error: "Jadwal harus di masa depan" }`

### FT-INS-103 — Kategori device tidak didukung ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/inspection/request` dengan `deviceCategory: "MOBIL"` (di luar enum yang didukung)
- **Then**: Validasi enum gagal, response HTTP 400

### FT-INS-104 — Submit report tanpa upload foto ditolak [NEGATIVE]
- **Given**: TEKNISI login, InspectionOrder IN_PROGRESS
- **When**: TEKNISI submit report dengan `photos: []`
- **Then**: Validasi gagal (minimum N foto), response HTTP 400, status order tidak berubah

## Edge Cases (GWTChecklist)

### FT-INS-201 — Tidak ada teknisi tersedia → kembali ke PENDING_ASSIGNMENT [EDGE]
- **Given**: InspectionOrder OFFLINE dengan kota target tidak punya teknisi tersedia (semua busy/jauh)
- **When**: Sistem mencoba auto-assign atau ADMIN klik assign
- **Then**: Status tetap `PENDING_ASSIGNMENT`, ADMIN mendapat notifikasi/flag perlu manual handling

## RBAC Enforcement

### FT-INS-901 — TEKNISI akses InspectionOrder yang tidak ditugaskan ditolak [RBAC]
- **Given**: InspectionOrder ditugaskan ke `ahmad` (teknisi1)
- **When**: TEKNISI `budi` mencoba GET / PATCH order tersebut via `/api/teknisi/inspection/[id]`
- **Then**: Response HTTP 403, tidak ada akses

## Catatan QA

- Implementasi: `src/lib/inspection-*.ts`
- API: `src/app/api/inspection/`, `src/app/api/teknisi/inspection/`, `src/app/api/admin/inspection/`
- Models: `InspectionOrder`, `InspectionReport` di `prisma/schema.prisma`
- PDF generation: PDFKit 0.18.0
- Storage: foto bukti & PDF di R2 (`src/lib/r2-storage.ts`)
