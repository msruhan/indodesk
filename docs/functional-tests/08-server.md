# Server Services

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Server Services menyediakan layanan berbasis "box server" (alat unlock/flash fisik atau virtual yang dikelola provider eksternal). Mirip dengan IMEI Services, namun fokus pada layanan yang butuh runtime lebih lama (mis. flash firmware, decode FRP). Provider dimodelkan via `ServerServiceBox`.

State machine: `PENDING → PROCESSING → SUCCESS | FAILED`. Refund otomatis saat `FAILED`.

## Cakupan Test

- Core Flow (DetailedTestCase): browse katalog, submit order, polling SUCCESS, lihat hasil, history.
- Edge Flow (GWTChecklist): service ID tidak ada, payload field wajib kosong, status service INACTIVE, error provider (timeout/credit habis).
- RBAC: USER/TEKNISI boleh order, ADMIN tidak boleh order atas nama orang lain.

## Detailed Test Cases

### FT-SRV-001 — Browse katalog Server Services
- **Role**: USER (atau Guest)
- **Priority**: P0
- **Preconditions**:
  - Database ter-seed dengan ≥ 1 ServerService ACTIVE
  - Opsional: login sebagai `siti@gmail.com` untuk uji order
- **Steps**:
  1. Buka `/server` (atau halaman server services)
  2. Pilih layanan
- **Expected Result**:
  - Daftar layanan tampil dengan harga + deliveryTime + requirement
  - Hanya status `ACTIVE` yang tampil
- **Postconditions**: tidak ada
- **References**: `src/app/api/server/services/...`, model `ServerService`

### FT-SRV-002 — Submit Server Order
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login `siti@gmail.com`, saldo cukup
  - Service ACTIVE tersedia
- **Test Data**:
  - `serviceId`
  - `imei`: 15 digit
  - `model`: nama model HP
- **Steps**:
  1. Buka detail service
  2. Klik "Order"
  3. Isi field wajib
  4. Konfirmasi pembayaran via wallet
- **Expected Result**:
  - POST `/api/server/orders` mengembalikan `{ success: true, data: { orderCode } }`
  - ServerOrder tercipta status `PENDING`
  - Saldo USER berkurang
  - Worker akan ambil order untuk diproses
- **Postconditions**:
  - Order tampil di `/user/server` atau `/user/orders`
- **References**: `src/lib/server-order-worker.ts`, `src/lib/server-order-scheduler.ts`, `src/app/api/server/orders/route.ts`

### FT-SRV-003 — Polling Server Order ke SUCCESS
- **Role**: USER (sistem)
- **Priority**: P0
- **Preconditions**:
  - ServerOrder PENDING ada (mis. milik `siti@gmail.com`)
  - Provider mock/real mengembalikan hasil
- **Steps**:
  1. Tunggu polling (atau trigger `/api/cron/server`)
- **Expected Result**:
  - Status `PENDING → PROCESSING → SUCCESS`
  - Field `code` / `result` terisi (mis. firmware download link, unlock code)
  - `processedAt` & `completedAt` terisi
  - Notifikasi USER
- **Postconditions**: hasil tampil di detail order
- **References**: `src/lib/server-order-worker.ts`

### FT-SRV-004 — Lihat detail Server Order
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - ServerOrder milik USER ada (PENDING/SUCCESS/FAILED)
- **Steps**:
  1. Buka `/user/server/[orderCode]`
- **Expected Result**:
  - Detail menampilkan service, IMEI, model, status, hasil/code, timestamp
- **Postconditions**: tidak ada
- **References**: `src/app/api/user/server/...`

### FT-SRV-005 — Failed order dengan auto-refund
- **Role**: USER (sistem)
- **Priority**: P0
- **Preconditions**:
  - ServerOrder PENDING (mis. milik `siti@gmail.com`) dengan provider yang akan return error (dev mock dengan flag failure)
- **Steps**:
  1. Tunggu polling
  2. Provider return error (mis. timeout, credit habis, invalid input)
- **Expected Result**:
  - Status `PROCESSING → FAILED`
  - WalletLedger `REFUND` untuk USER sebesar harga
  - Saldo kembali utuh
  - Notifikasi USER "Order gagal, dana dikembalikan"
- **Postconditions**:
  - Order ada di history dengan label FAILED
- **References**: `src/lib/server-order-worker.ts` (refund handling)

## Negative Scenarios (GWTChecklist)

### FT-SRV-101 — Service ID tidak ada ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/server/orders` dengan `serviceId: "tidak-ada"`
- **Then**: Response HTTP 404 `{ success: false, error: "Service tidak ditemukan" }`

### FT-SRV-102 — Field wajib kosong ditolak [NEGATIVE]
- **Given**: USER login; service yang requiresImei + requiresModel
- **When**: POST `/api/server/orders` tanpa field `imei` atau `model`
- **Then**: Validasi Zod gagal, response HTTP 400

### FT-SRV-103 — Status service INACTIVE ditolak [NEGATIVE]
- **Given**: ServerService dengan `status = INACTIVE`
- **When**: USER POST order ke service tersebut
- **Then**: Response HTTP 400 `{ success: false, error: "Service tidak aktif" }`, order tidak tercipta, saldo tidak berkurang

## Edge Cases (GWTChecklist)

### FT-SRV-201 — Provider Server return timeout → order FAILED + refund [EDGE]
- **Given**: ServerOrder PENDING; provider mock return timeout
- **When**: Worker memproses
- **Then**: Status `PROCESSING → FAILED`, WalletLedger REFUND USER, saldo kembali utuh, notifikasi USER

## RBAC Enforcement

### FT-SRV-901 — USER lain akses ServerOrder bukan miliknya ditolak [RBAC]
- **Given**: ServerOrder milik `siti`
- **When**: USER `rudi` mencoba GET detail order tersebut
- **Then**: Response HTTP 403 atau 404, order tidak terbaca

## Catatan QA

- Worker & scheduler: `src/lib/server-order-worker.ts`, `src/lib/server-order-scheduler.ts`
- API: `src/app/api/server/services/`, `src/app/api/server/orders/`
- Models: `ServerServiceBox`, `ServerService`, `ServerOrder` di `prisma/schema.prisma`
- Background job di-start otomatis via `src/instrumentation.ts`
