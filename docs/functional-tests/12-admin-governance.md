# Admin Governance

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Admin Governance mencakup tugas pengelolaan platform oleh ADMIN: approval listing produk dan toko teknisi, manajemen artikel bantuan (HelpArticle), pengaturan platform (PlatformSetting), monitoring sesi (konsultasi/remote/inspection), pembacaan ActivityLog audit, dan moderasi review/dispute. Domain ini membutuhkan RBAC ketat — tidak boleh diakses USER atau TEKNISI.

## Cakupan Test

- Core Flow (DetailedTestCase): approve product listing, approve teknisi store, kelola HelpArticle, kelola PlatformSetting, monitoring sesi konsultasi/remote, baca ActivityLog, manajemen banner marketplace.
- Edge Flow (GWTChecklist): reject listing dengan alasan, batal approval setelah dipublikasi, hapus banner aktif.
- RBAC: USER & TEKNISI ditolak akses semua endpoint admin.

## Security Hardening (wallet governance)

### FT-ADM-SEC-001 — Dual-control deposit approval
- **Role**: ADMIN
- **Priority**: P0
- **Steps**: Lihat antrian `/api/admin/wallet/deposit/pending` → approve/reject dengan dua admin berbeda untuk nominal besar
- **Expected**: State machine `PENDING_APPROVAL → APPROVED_BY_ONE → APPROVED`; ledger + saldo konsisten

### FT-ADM-SEC-002 — Wallet reconciliation cron
- **Role**: OPS / cron
- **Priority**: P2
- **Steps**: GET `/api/cron/wallet-reconciliation` dengan `Authorization: Bearer $CRON_SECRET`
- **Expected**: Drift balance vs ledger dilaporkan; tidak error 401

## Detailed Test Cases

### FT-ADM-001 — Approve product listing PENDING
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**:
  - Login `admin@indoteknizi.com`
  - Ada Product dengan `listingStatus = PENDING` (mis. seed `Unlock Tool Premium License`)
- **Test Data**:
  - Target: produk seed `Unlock Tool Premium License`
- **Steps**:
  1. Buka `/admin/products` filter PENDING
  2. Klik produk
  3. Review konten + gambar
  4. Klik "Approve"
- **Expected Result**:
  - `listingStatus: PENDING → APPROVED`, `isPublished: true`
  - Notifikasi TEKNISI seller
  - ActivityLog `product.approved`
- **Postconditions**:
  - Produk tampil di marketplace publik
- **References**: `src/app/api/admin/products/[id]/approve/...`, `src/lib/activity-log.ts`

### FT-ADM-002 — Reject product listing dengan alasan
- **Role**: ADMIN
- **Priority**: P1
- **Preconditions**:
  - Login `admin@indoteknizi.com`
  - Ada Product PENDING
- **Test Data**:
  - Alasan: `Foto tidak jelas, harap unggah ulang dengan resolusi lebih baik.`
- **Steps**:
  1. Buka detail produk PENDING
  2. Klik "Reject"
  3. Isi alasan
  4. Konfirmasi
- **Expected Result**:
  - `listingStatus: PENDING → REJECTED`, alasan tersimpan
  - Notifikasi TEKNISI dengan alasan
- **Postconditions**:
  - TEKNISI dapat edit & re-submit
- **References**: `src/app/api/admin/products/[id]/reject/...`

### FT-ADM-003 — Approve teknisi store baru
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**:
  - Login `admin@indoteknizi.com`
  - TeknisiStore status `PENDING`
- **Steps**:
  1. Buka `/admin/teknisi/stores` filter PENDING
  2. Klik store
  3. Review profile, alamat, kelengkapan info
  4. Klik "Approve"
- **Expected Result**:
  - Store `listingStatus: APPROVED`, `isPublished: true`
  - Profil teknisi tampil di `/teknisi` listing publik
  - Notifikasi TEKNISI
- **Postconditions**:
  - TEKNISI bisa terima order
- **References**: `src/app/api/admin/teknisi/stores/...`

### FT-ADM-004 — Kelola HelpArticle
- **Role**: ADMIN
- **Priority**: P1
- **Preconditions**:
  - Login `admin@indoteknizi.com`
- **Test Data**:
  - Title: `Cara unlock IMEI iPhone`
  - Body: konten Markdown
  - Category: `Tutorial`
- **Steps**:
  1. Buka `/admin/help`
  2. Klik "Tambah Artikel"
  3. Isi title, body, category
  4. Publish
- **Expected Result**:
  - HelpArticle tercipta, `isPublished = true`
  - Tampil di `/bantuan` (atau halaman help publik)
- **Postconditions**: tidak ada
- **References**: `src/app/api/admin/help/...`, model `HelpArticle`

### FT-ADM-005 — Kelola PlatformSetting (feature flag)
- **Role**: ADMIN
- **Priority**: P1
- **Preconditions**:
  - Login `admin@indoteknizi.com`
- **Test Data**:
  - Toggle `MAINTENANCE_MODE` dari `false → true`
- **Steps**:
  1. Buka `/admin/settings`
  2. Cari setting
  3. Toggle nilai
  4. Simpan
- **Expected Result**:
  - PlatformSetting ter-update
  - FeatureFlagsContext (sisi client) memuat nilai baru saat refresh
- **Postconditions**:
  - Behavior platform mengikuti nilai baru (mis. maintenance banner tampil)
- **References**: `src/contexts/feature-flags-context.tsx`, model `PlatformSetting`

### FT-ADM-006 — Monitoring sesi (konsultasi & remote)
- **Role**: ADMIN
- **Priority**: P1
- **Preconditions**:
  - Login `admin@indoteknizi.com`
  - Ada sesi konsultasi & remote di berbagai status (lihat seed)
- **Steps**:
  1. Buka `/admin/monitoring` (atau halaman dashboard yang relevan)
  2. Filter periode + status
- **Expected Result**:
  - Daftar sesi tampil dengan kolom: USER, TEKNISI, status, waktu mulai, durasi, harga
  - Data konsisten dengan database (verifikasi via Prisma Studio)
- **Postconditions**: tidak ada
- **References**: `src/app/api/admin/monitoring/...`

### FT-ADM-007 — Baca ActivityLog audit trail
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**:
  - Login `admin@indoteknizi.com`
  - ActivityLog ter-seed (≥ 12 entries di `prisma/seed.ts`)
- **Steps**:
  1. Buka `/admin/activity-log`
  2. Filter: kategori AUTH, severity WARNING, periode hari ini
- **Expected Result**:
  - Filter bekerja, tampil entry seperti `auth.login.failed`, `auth.suspicious.brute_force`
  - Setiap entry menampilkan: action, summary, actor, IP, timestamp, metadata JSON
- **Postconditions**: tidak ada
- **References**: `src/lib/activity-log.ts`, `src/app/api/admin/activity-log/...`, model `ActivityLog`

## Negative Scenarios (GWTChecklist)

### FT-ADM-101 — Approve produk yang sudah APPROVED ditolak [NEGATIVE]
- **Given**: ADMIN login; produk dengan `listingStatus = APPROVED`
- **When**: ADMIN POST `/api/admin/products/[id]/approve` lagi
- **Then**: Response HTTP 409 `{ success: false, error: "State tidak valid" }` atau idempotent (tidak melakukan apa-apa)

### FT-ADM-102 — Reject produk tanpa alasan ditolak [NEGATIVE]
- **Given**: ADMIN login; produk PENDING
- **When**: POST `/api/admin/products/[id]/reject` dengan `reason: ""`
- **Then**: Validasi gagal, response HTTP 400 dengan pesan alasan wajib diisi

### FT-ADM-103 — Manual deposit dengan nominal ≤ 0 ditolak [NEGATIVE]
- **Given**: ADMIN login
- **When**: POST `/api/admin/wallet/manual-deposit` dengan `amount: 0` atau negatif
- **Then**: Validasi Zod gagal, response HTTP 400, saldo target tidak berubah

## Edge Cases (GWTChecklist)

### FT-ADM-201 — Reject store yang sudah PUBLISHED [EDGE]
- **Given**: TeknisiStore status APPROVED + isPublished true
- **When**: ADMIN klik "Reject" / "Unpublish"
- **Then**: Status berubah, store tidak tampil di publik lagi, notifikasi TEKNISI dengan alasan, ActivityLog tercatat

## RBAC Enforcement

### FT-ADM-901 — USER mengakses /admin/* ditolak [RBAC]
- **Given**: USER `siti@gmail.com` login (role USER)
- **When**: USER membuka `/admin/dashboard` atau GET `/api/admin/users`
- **Then**: Halaman web → redirect ke role miliknya atau `/login`; API → response HTTP 403 `{ success: false, error: "Forbidden" }`

### FT-ADM-902 — TEKNISI mengakses /api/admin/* ditolak [RBAC]
- **Given**: TEKNISI `ahmad@indoteknizi.com` login
- **When**: TEKNISI POST `/api/admin/products/[id]/approve`
- **Then**: Response HTTP 403, tidak ada perubahan listingStatus

### FT-ADM-903 — Guest mengakses authenticated page redirect ke login [RBAC]
- **Given**: Tidak ada session aktif
- **When**: Guest membuka `/admin/users` atau `/user/orders`
- **Then**: Redirect ke `/login?callbackUrl=<path>` dengan callbackUrl tersimpan

## Catatan QA

- Implementasi: `src/lib/activity-log.ts`, `src/lib/admin-*.ts`
- API: `src/app/api/admin/*` (RBAC ketat)
- Models: `HelpArticle`, `PlatformSetting`, `ActivityLog`, `MarketplaceBanner`
- Middleware RBAC: `src/proxy.ts`
- Seed sample ActivityLog mencakup 12 jenis event (lihat `prisma/seed.ts` bagian `activityLog.createMany`)
