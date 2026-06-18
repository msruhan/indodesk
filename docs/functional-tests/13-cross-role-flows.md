# Cross-Role End-to-End Flows

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

File ini berisi skenario end-to-end yang melibatkan **lebih dari satu role** secara berurutan. Setiap skenario dieksekusi dengan beberapa akun seed dalam satu sesi QA, biasanya menggunakan beberapa browser/incognito tab agar bisa berpindah role tanpa logout-login berulang.

CrossRoleDoc juga menyajikan matriks RBAC ringkas yang memvalidasi bahwa setiap role hanya bisa mengakses resource yang menjadi haknya.

## End-to-End Scenarios

### FT-CROSS-001 — Marketplace E2E (USER ↔ TEKNISI ↔ ADMIN)
- **Role**: USER `siti` → TEKNISI `ahmad` → ADMIN → USER `siti`
- **Priority**: P0
- **Preconditions**:
  - Database ter-seed
  - USER `siti@gmail.com` saldo Rp 9.000.000
  - TEKNISI `ahmad@indoteknizi.com` punya store APPROVED + produk `iPhone 13 Pro Max - Second` APPROVED
- **Test Data**:
  - Produk: `iPhone 13 Pro Max - Second` (Rp 8.500.000, stok 3)
  - Tracking number: `JNE5550001111`
- **Steps**:
  1. **USER**: Login `siti@gmail.com`, browse `/marketplace`, klik produk, tambah ke cart, checkout via wallet
  2. **TEKNISI**: Login `ahmad@indoteknizi.com` di tab/browser kedua, buka `/teknisi/orders`, klik order baru (status PAID), klik "Proses & Kirim", input kurir JNE + tracking number
  3. **ADMIN**: Login `admin@indoteknizi.com`, buka monitoring/`/admin/orders`, lihat order baru di list, verifikasi data konsisten
  4. **Sistem**: tracking polling memperbarui status menjadi DELIVERED (atau trigger manual)
  5. **USER**: Buka `/user/orders`, klik order, klik "Konfirmasi Diterima"
  6. **USER**: Klik "Beri Review", isi rating + comment, submit
- **Expected Result**:
  - Order melewati transisi PAID → SHIPPED → DELIVERED → COMPLETED
  - Saldo `siti` berkurang Rp 8.500.000 di langkah 1
  - Saldo `ahmad` bertambah saat order COMPLETED (potong fee jika ada)
  - WalletLedger DEBIT (siti), HOLD, lalu EARNING (ahmad) tercatat
  - PlatformNotification dikirim ke USER (paket dikirim, paket tiba) dan TEKNISI (order baru, dikonfirmasi)
  - Review tersimpan, rating produk recompute
- **Postconditions**:
  - Order tampil di "Riwayat" kedua sisi
  - Stok produk berkurang menjadi 2
- **References**: `src/lib/marketplace-checkout.ts`, `src/lib/marketplace-wallet.ts`, `src/lib/order-tracking-worker.ts`
- **Validates**: Skenario integrasi marketplace + wallet + tracking + review (lihat FT-MKT-001..008)

### FT-CROSS-002 — Rekber dengan Dispute (USER ↔ TEKNISI ↔ USER ↔ ADMIN)
- **Role**: USER `rudi` → TEKNISI `budi` → USER `rudi` → ADMIN
- **Priority**: P0
- **Preconditions**:
  - USER `rudi@gmail.com` saldo cukup (top-up dulu via FT-WAL-001 + FT-WAL-002 jika perlu)
  - TEKNISI `budi@indoteknizi.com` aktif
- **Test Data**:
  - Amount rekber: Rp 5.000.000
  - Description: `Pembelian unit demo`
  - Alasan dispute: `Layanan tidak sesuai deskripsi.`
- **Steps**:
  1. **USER**: Login `rudi@gmail.com`, buat rekber baru ke `budi@indoteknizi.com` Rp 5.000.000, bayar via wallet → status HELD
  2. **TEKNISI**: Login `budi@indoteknizi.com`, klaim sudah memberikan layanan/barang
  3. **USER**: Login kembali `rudi`, buka detail rekber, klik "Ajukan Dispute", isi alasan, submit
  4. **ADMIN**: Login `admin@indoteknizi.com`, buka `/admin/rekber` filter "dispute", review bukti dari kedua pihak, putuskan REFUND ke buyer
- **Expected Result**:
  - Rekber bertransisi HELD → (dispute flag) → REFUNDED
  - Saldo `rudi` dikembalikan sebesar amount (fee mengikuti kebijakan platform)
  - WalletLedger REFUND tercipta
  - ActivityLog `rekber.dispute.opened` dan `rekber.refunded` tercatat
  - Notifikasi ke kedua pihak
- **Postconditions**:
  - Rekber tidak bisa diubah lagi (terminal state)
- **References**: `src/lib/rekber-*.ts`, `src/lib/activity-log.ts`
- **Validates**: FT-RKB-001..004 + RBAC ADMIN

### FT-CROSS-003 — Inspection E2E (USER ↔ ADMIN ↔ TEKNISI ↔ USER)
- **Role**: USER `dewi` → ADMIN → TEKNISI `ahmad` → USER `dewi`
- **Priority**: P0
- **Preconditions**:
  - USER `dewi@gmail.com` saldo cukup untuk biaya inspeksi (top-up dulu jika perlu)
  - TEKNISI `ahmad` aktif dan tersedia di area pelayanan
- **Test Data**:
  - Mode: OFFLINE
  - Device: `iPhone 14 Pro`
  - Address: `Jl. Diponegoro No. 12, Jakarta`
  - Schedule: hari berikutnya 14:00
- **Steps**:
  1. **USER**: Login `dewi`, buka `/inspeksi`, request offline dengan field lengkap, bayar via wallet → status PENDING_ASSIGNMENT
  2. **ADMIN**: Login `admin`, buka `/admin/inspeksi`, klik order PENDING, assign ke `ahmad`
  3. **TEKNISI**: Login `ahmad`, terima penugasan, klik "Mulai Inspeksi" → status IN_PROGRESS
  4. **TEKNISI**: Isi checklist 10 item, upload 3 foto, submit report → status REPORT_SUBMITTED, PDF & sertifikat ter-generate
  5. **USER**: Buka `/user/inspeksi`, download report PDF dan sertifikat
- **Expected Result**:
  - Status InspectionOrder transisi: PENDING_ASSIGNMENT → ASSIGNED → IN_PROGRESS → REPORT_SUBMITTED → COMPLETED
  - PDF tersimpan di R2, URL dapat di-download
  - Sertifikat memuat QR code yang valid (link ke verifikasi publik)
  - Saldo `dewi` berkurang di langkah 1; settlement ke wallet `ahmad` saat REPORT_SUBMITTED
- **Postconditions**:
  - QR di sertifikat dapat di-scan oleh pihak ketiga untuk verifikasi keaslian inspeksi
- **References**: `src/lib/inspection-*.ts` (PDFKit + QR), `src/lib/r2-storage.ts`
- **Validates**: FT-INS-001..006

### FT-CROSS-004 — Konsultasi E2E (USER ↔ TEKNISI ↔ USER ↔ TEKNISI)
- **Role**: USER `siti` → TEKNISI `ahmad` → USER `siti` → TEKNISI `ahmad`
- **Priority**: P0
- **Preconditions**:
  - USER `siti` saldo cukup
  - TEKNISI `ahmad` aktif (online status di-set ON)
- **Test Data**:
  - Service: `Konsultasi Unlock` (Rp 50.000)
  - Rating: 5
  - Review: `Penjelasannya jelas dan sangat membantu.`
- **Steps**:
  1. **USER**: Login `siti`, buka profil `ahmad`, klik "Booking Konsultasi", pilih service, bayar via wallet → status PENDING
  2. **TEKNISI**: Login `ahmad`, buka `/teknisi/konsultasi`, klik booking, klik "Terima" → status ACTIVE
  3. **TEKNISI & USER**: Berinteraksi via channel chat sesi (verifikasi pesan terkirim dua arah)
  4. **TEKNISI**: Klik "Selesaikan Sesi" → status COMPLETED, settlement ke wallet TEKNISI
  5. **USER**: Buka detail sesi COMPLETED, klik "Beri Ulasan", isi rating + review, submit
  6. **TEKNISI**: Buka `/teknisi/wallet`, lihat earning baru di ledger
- **Expected Result**:
  - Sesi melewati transisi PENDING → ACTIVE → COMPLETED
  - WalletLedger HOLD (saat PENDING) → EARNING (saat COMPLETED) untuk TEKNISI
  - TeknisiReview tercipta, rating profil di-recompute
  - Saldo TEKNISI bertambah dengan deskripsi `Pendapatan konsultasi: Konsultasi Unlock`
- **Postconditions**:
  - Sesi muncul di history kedua role
- **References**: `src/lib/konsultasi-*.ts`, model `KonsultasiSession`, `TeknisiReview`
- **Validates**: FT-KON-001..005

### FT-CROSS-005 — Listing Approval E2E (TEKNISI ↔ ADMIN ↔ USER)
- **Role**: TEKNISI `budi` → ADMIN → USER `siti`
- **Priority**: P0
- **Preconditions**:
  - TEKNISI `budi` punya store APPROVED
  - USER `siti` saldo Rp 9.000.000
- **Test Data**:
  - Produk baru: `OPPO Reno 11 - Demo Unit` (Rp 4.500.000, stok 5, kategori HANDPHONE)
- **Steps**:
  1. **TEKNISI**: Login `budi`, buka `/teknisi/produk/baru`, isi data produk, upload foto, klik "Submit untuk Review" → status PENDING
  2. **ADMIN**: Login `admin`, buka `/admin/products` filter PENDING, review produk, klik "Approve" → status APPROVED + isPublished true
  3. **USER**: Login `siti`, buka `/marketplace`, cari produk `OPPO Reno 11`, verifikasi tampil di listing publik
  4. **USER**: Klik produk, tambah ke cart, checkout
- **Expected Result**:
  - Produk muncul di marketplace publik hanya setelah ADMIN approve
  - Order baru tercipta status PAID setelah USER checkout
  - Stok berkurang dari 5 menjadi 4
  - Notifikasi TEKNISI saat ada order baru
- **Postconditions**:
  - Produk APPROVED siap untuk lifecycle marketplace berikutnya
- **References**: `src/app/api/teknisi/products/...`, `src/app/api/admin/products/[id]/approve/...`
- **Validates**: FT-STR-007 + FT-ADM-001 + FT-MKT-003

## RBAC Cross-Role Matrix

Matriks ringkas (referensi QA). Implementasi otomatis memakai endpoint aktual di bawah.

| #  | FT ID | Aktor | Resource (dokumen) | Implementasi API/halaman |
| -- | ----- | ----- | ------------------ | ------------------------ |
| 1  | 901 | USER `siti` | `GET /api/admin/users` | sama |
| 2  | 902 | USER `siti` | `GET /admin/dashboard` | redirect `/user/dashboard` |
| 3  | 903 | TEKNISI `ahmad` | approve produk admin | `POST /api/admin/approval` |
| 4  | 904 | TEKNISI `ahmad` | `GET /admin/users` | redirect `/teknisi/dashboard` |
| 5  | 905 | USER `siti` | `PATCH /api/teknisi/store/update` | `PATCH /api/teknisi/toko` |
| 6  | 906 | USER `rudi` | ship order teknisi | `PATCH /api/teknisi/marketplace/orders/[id]` action `set_shipment` |
| 7  | 907 | Guest | `/user/orders` | redirect `/login?callbackUrl=...` |
| 8  | 908 | Guest | `/teknisi/dashboard` | redirect login |
| 9  | 909 | Guest | `/admin/activity-log` | redirect login (prefix `/admin`) |
| 10 | 910 | TEKNISI `budi` | order milik `ahmad` | `PATCH` marketplace order seed `ORD-2026-000001` → 404 |
| 11 | 911 | USER `rudi` | order milik `siti` | `GET /api/user/marketplace/orders/[id]/tracking` → 404 |
| 12 | 912 | TEKNISI `ahmad` | manual deposit admin | `POST /api/admin/wallet/deposit` → 403 |

## RBAC Enforcement

### FT-CROSS-901 — USER siti tidak boleh GET /api/admin/users [RBAC]
- **Role**: USER `siti@gmail.com`
- **When**: `GET /api/admin/users`
- **Expected Result**: HTTP 403, `error: "Forbidden"`

### FT-CROSS-902 — USER siti tidak boleh buka /admin/dashboard [RBAC]
- **Role**: USER `siti@gmail.com`
- **When**: `GET /admin/dashboard`
- **Expected Result**: Redirect ke `/user/dashboard`

### FT-CROSS-903 — TEKNISI ahmad tidak boleh approve produk via admin API [RBAC]
- **Role**: TEKNISI `ahmad@indoteknizi.com`
- **When**: `POST /api/admin/approval` (entityType product, action approve)
- **Expected Result**: HTTP 403

### FT-CROSS-904 — TEKNISI ahmad tidak boleh buka /admin/users [RBAC]
- **Role**: TEKNISI `ahmad@indoteknizi.com`
- **When**: `GET /admin/users`
- **Expected Result**: Redirect ke `/teknisi/dashboard`

### FT-CROSS-905 — USER siti tidak boleh PATCH toko teknisi [RBAC]
- **Role**: USER `siti@gmail.com`
- **When**: `PATCH /api/teknisi/toko` dengan payload valid
- **Expected Result**: HTTP 403

### FT-CROSS-906 — USER rudi tidak boleh ship order sebagai teknisi [RBAC]
- **Role**: USER `rudi@gmail.com`
- **When**: `PATCH /api/teknisi/marketplace/orders/[id]` action `set_shipment`
- **Expected Result**: HTTP 403

### FT-CROSS-907 — Guest tidak boleh buka /user/orders [RBAC]
- **Role**: Guest
- **When**: `GET /user/orders`
- **Expected Result**: Redirect ke `/login` dengan `callbackUrl=/user/orders`

### FT-CROSS-908 — Guest tidak boleh buka /teknisi/dashboard [RBAC]
- **Role**: Guest
- **When**: `GET /teknisi/dashboard`
- **Expected Result**: Redirect ke `/login` dengan `callbackUrl=/teknisi/dashboard`

### FT-CROSS-909 — Guest tidak boleh buka area /admin/* [RBAC]
- **Role**: Guest
- **When**: `GET /admin/activity-log`
- **Expected Result**: Redirect ke `/login` dengan `callbackUrl` yang sesuai

### FT-CROSS-910 — TEKNISI budi tidak boleh ubah order marketplace milik ahmad [RBAC]
- **Role**: TEKNISI `budi@indoteknizi.com`
- **Preconditions**: Order seed `ORD-2026-000001` (seller `ahmad`)
- **When**: `PATCH /api/teknisi/marketplace/orders/[id]` (bukan milik budi)
- **Expected Result**: HTTP 404 (order tidak ditemukan untuk seller tersebut)

### FT-CROSS-911 — USER rudi tidak boleh akses tracking order milik siti [RBAC]
- **Role**: USER `rudi@gmail.com`
- **Preconditions**: Order seed `ORD-2026-000001` (buyer `siti`)
- **When**: `GET /api/user/marketplace/orders/[id]/tracking`
- **Expected Result**: HTTP 404

### FT-CROSS-912 — TEKNISI ahmad tidak boleh manual deposit admin [RBAC]
- **Role**: TEKNISI `ahmad@indoteknizi.com`
- **When**: `POST /api/admin/wallet/deposit`
- **Expected Result**: HTTP 403

## Catatan QA

- Skenario E2E perlu **2-3 browser/incognito tab** terbuka simultan untuk berpindah role tanpa logout
- Selalu refresh DB ke state baseline via `npm run db:reset && npm run db:seed` sebelum mulai E2E run
- Verifikasi via Prisma Studio (`npm run db:studio`) untuk memastikan WalletLedger entries konsisten setelah skenario rampung
- Implementasi guard RBAC: middleware di `src/proxy.ts`, helper di `src/lib/api-auth.ts`
- ActivityLog tetap tercatat sepanjang skenario — periksa di `/admin/activity-log` setelah selesai untuk audit trail
