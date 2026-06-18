# IMEI Services

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

IMEI Services menyediakan layanan unlock, blacklist check, iCloud removal, FRP remove, dan pengecekan jaringan untuk berbagai brand handphone. Layanan dijalankan oleh provider eksternal (DhruFusion) yang dikelola via `ImeiApi`. USER memilih layanan, mengirim IMEI (+ model/network/provider sesuai requirement), bayar via wallet, lalu order dijalankan oleh worker polling sampai `SUCCESS` atau `FAILED`.

State machine: `PENDING → PROCESSING → SUCCESS | FAILED`. Saat `FAILED`, dana otomatis di-refund ke USER.

## Cakupan Test

- Core Flow (DetailedTestCase): browse layanan, submit order IMEI sederhana, submit order dengan model/network/provider, polling ke SUCCESS, lihat hasil unlock code.
- Edge Flow (GWTChecklist): IMEI invalid, service ID tidak ada, field wajib kosong, error provider (timeout/credit/IMEI rejected), service INACTIVE.
- RBAC: USER/TEKNISI boleh order, ADMIN read-only di endpoint admin.

## Detailed Test Cases

### FT-IMEI-001 — Browse katalog IMEI services
- **Role**: USER (atau Guest read-only)
- **Priority**: P0
- **Preconditions**:
  - Database ter-seed (≥ 6 ImeiServiceGroup, 9 ImeiService ACTIVE)
  - Opsional: login sebagai `siti@gmail.com` untuk uji tombol order
- **Steps**:
  1. Buka `/imei`
  2. Pilih grup (mis. "Samsung Unlock")
  3. Pilih layanan
- **Expected Result**:
  - Daftar grup tampil sesuai `sortOrder`
  - Setiap layanan menampilkan nama, harga, deliveryTime, dan field requirement (icon untuk requiresImei/Model/Network/Provider)
- **Postconditions**: tidak ada
- **References**: `src/app/api/imei/services/...`, model `ImeiService`, `ImeiServiceGroup`

### FT-IMEI-002 — Submit order IMEI sederhana (hanya IMEI)
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Saldo ≥ Rp 25.000
  - Service `IMEI Blacklist Check (Worldwide)` ACTIVE (lihat seed)
- **Test Data**:
  - `serviceId`: dari `svcCheck` seed
  - `imei`: `353456789012345` (15 digit)
- **Steps**:
  1. Buka detail service
  2. Klik "Order Sekarang"
  3. Masukkan IMEI
  4. Konfirmasi pembayaran via wallet
- **Expected Result**:
  - POST `/api/imei/orders` mengembalikan `{ success: true, data: { orderId, orderCode, status: 'PENDING' } }`
  - ImeiOrder tercipta dengan status `PENDING`
  - Saldo USER berkurang Rp 25.000, WalletLedger DEBIT
- **Postconditions**:
  - Order tampil di `/user/imei` dan akan diproses oleh `imei-order-worker`
- **References**: `src/lib/imei-order-worker.ts`, `src/lib/imei-order-scheduler.ts`, `src/app/api/imei/orders/route.ts`

### FT-IMEI-003 — Submit order IMEI dengan field wajib lengkap
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Saldo ≥ Rp 150.000
  - Service `Samsung Galaxy S24 Ultra Unlock (All Carriers)` (`requiresImei + requiresNetwork + requiresModel`)
- **Test Data**:
  - `imei`: `356938035643809`
  - `model`: `SM-S928B`
  - `network`: `Telkomsel`
- **Steps**:
  1. Buka detail service
  2. Klik "Order"
  3. Isi IMEI + model + network
  4. Konfirmasi
- **Expected Result**:
  - Validasi Zod menerima semua field wajib
  - ImeiOrder tercipta dengan status `PENDING` dan field tambahan tersimpan
  - Saldo berkurang Rp 150.000
- **Postconditions**: order siap diproses worker
- **References**: validasi `requiresModel/Network/Provider` di endpoint

### FT-IMEI-004 — Polling order SUCCESS dengan kode unlock
- **Role**: USER (sistem)
- **Priority**: P0
- **Preconditions**:
  - ImeiOrder status `PENDING` ada (mis. milik `siti@gmail.com`)
  - DhruFusion mock atau real mengembalikan kode
- **Steps**:
  1. Tunggu polling worker (interval default — sekitar 30-60 detik) atau trigger manual `/api/cron/imei`
  2. Worker memanggil DhruFusion API
  3. Provider mengembalikan kode unlock
- **Expected Result**:
  - Status `PENDING → PROCESSING → SUCCESS`
  - Field `code` terisi (mis. `NCK: 12345678\nFREEZE: 87654321`)
  - `processedAt` dan `completedAt` terisi
  - Notifikasi USER "Order IMEI berhasil"
- **Postconditions**:
  - USER bisa lihat dan copy kode di detail order
- **References**: `src/lib/dhru-fusion.ts`, `src/lib/imei-order-worker.ts`

### FT-IMEI-005 — Lihat history & detail order IMEI
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - ImeiOrder seed `IMEI-2026-A1B2C3` (status SUCCESS) milik user1
- **Steps**:
  1. Buka `/user/imei` atau `/user/orders`
  2. Klik order `IMEI-2026-A1B2C3`
- **Expected Result**:
  - Detail menampilkan service name, IMEI, status SUCCESS, kode unlock
  - Tombol "Copy" untuk kode tersedia
- **Postconditions**: tidak ada
- **References**: `src/app/api/user/imei/...`

## Negative Scenarios (GWTChecklist)

### FT-IMEI-101 — IMEI panjang ≠ 15 digit ditolak [NEGATIVE]
- **Given**: USER `siti@gmail.com` login
- **When**: POST `/api/imei/orders` dengan `imei: "12345"` (5 digit)
- **Then**: Validasi Zod gagal, response `{ success: false, error: <pesan length> }` HTTP 400

### FT-IMEI-102 — IMEI berisi karakter non-numerik ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/imei/orders` dengan `imei: "12345ABC9012345"`
- **Then**: Validasi gagal, response HTTP 400

### FT-IMEI-103 — Service ID tidak ada ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/imei/orders` dengan `serviceId: "tidak-ada"` + IMEI valid
- **Then**: Response HTTP 404 `{ success: false, error: "Service tidak ditemukan" }`, tidak ada order tercipta

### FT-IMEI-104 — Field model/network kosong padahal requiresModel=true ditolak [NEGATIVE]
- **Given**: USER login; Service Samsung S24 Unlock (requiresModel=true, requiresNetwork=true)
- **When**: POST `/api/imei/orders` dengan `imei` valid namun `model: null` dan `network: null`
- **Then**: Validasi gagal di server (cross-field check), response HTTP 400 dengan pesan yang menyebut field yang kurang

## Edge Cases (GWTChecklist)

### FT-IMEI-201 — Provider DhruFusion timeout → order FAILED + auto refund [EDGE]
- **Given**: ImeiOrder PENDING; provider DhruFusion (mock) di-set untuk timeout
- **When**: Worker memproses order
- **Then**: Status `PROCESSING → FAILED`, WalletLedger `REFUND` USER sebesar harga, saldo kembali, notifikasi "Order gagal, dana dikembalikan"

### FT-IMEI-202 — Provider return "credit habis" → order FAILED + auto refund [EDGE]
- **Given**: ImeiOrder PENDING; provider return error code "INSUFFICIENT_CREDIT"
- **When**: Worker memproses
- **Then**: Status FAILED, refund otomatis, ActivityLog severity WARNING tercatat untuk monitoring ADMIN

## RBAC Enforcement

### FT-IMEI-901 — USER lain mengakses ImeiOrder bukan miliknya ditolak [RBAC]
- **Given**: ImeiOrder seed `IMEI-2026-A1B2C3` milik `siti` (user1.id)
- **When**: USER `rudi` mencoba GET `/api/user/imei/IMEI-2026-A1B2C3`
- **Then**: Response HTTP 403 atau 404 (untuk hindari information leak), order tidak terbaca

## Catatan QA

- DhruFusion client: `src/lib/dhru-fusion.ts`
- Worker & scheduler: `src/lib/imei-order-worker.ts`, `src/lib/imei-order-scheduler.ts`
- API USER: `src/app/api/imei/orders/`, `src/app/api/user/imei/`
- Models: `ImeiApi`, `ImeiServiceGroup`, `ImeiService`, `ImeiOrder` di `prisma/schema.prisma`
- Background job di-start otomatis via `src/instrumentation.ts`
