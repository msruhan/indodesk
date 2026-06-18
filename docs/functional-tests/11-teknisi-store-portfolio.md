# Teknisi Store & Portfolio

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Domain ini mencakup pengelolaan profil dan toko TEKNISI: aktivasi store, edit profile cover, portfolio case (foto + cerita servis), galeri toko, journey timeline, jam operasional, dan submit listing produk untuk approval ADMIN. Toko hanya tampil publik setelah `listingStatus = APPROVED` dan `isPublished = true`.

State store: `DRAFT → PENDING → APPROVED | REJECTED → PUBLISHED`.

## Cakupan Test

- Core Flow (DetailedTestCase): aktivasi store, edit profil/cover/avatar, tambah portfolio case, update gallery, update journey, update operating hours, submit listing produk untuk approval.
- Edge Flow (GWTChecklist): submit store dengan field wajib kosong, upload file > 2MB, listing produk harga 0, slot portfolio penuh.
- RBAC: USER tidak boleh akses `/api/teknisi/store/*`.

## Detailed Test Cases

### FT-STR-001 — TEKNISI aktivasi store baru
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login `budi@indoteknizi.com` (belum punya store atau lakukan reset)
- **Test Data**:
  - `name`: `Budi Mobile Service`
  - `city`: `Jakarta Pusat`
  - `address`: `Jl. Sabang No. 12`
  - `phone`: `0822-3333-4444`
- **Steps**:
  1. Buka `/teknisi/toko`
  2. Klik "Aktivasi Toko"
  3. Isi nama, kota, alamat, telepon
  4. Submit
- **Expected Result**:
  - TeknisiStore tercipta dengan `listingStatus = DRAFT` (atau `PENDING` jika langsung review)
  - Sidebar TEKNISI menampilkan menu Store baru
- **Postconditions**:
  - Store siap dilengkapi konten
- **References**: `src/lib/teknisi-store-*.ts`, `src/app/api/teknisi/store/...`, model `TeknisiStore`

### FT-STR-002 — Edit profile picture & cover image
- **Role**: TEKNISI
- **Priority**: P1
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
  - File gambar siap (cover ≤ 5MB, avatar ≤ 2MB)
- **Test Data**: file `cover.jpg`, `avatar.jpg`
- **Steps**:
  1. Buka `/teknisi/profil`
  2. Klik avatar → upload baru
  3. Klik area cover → upload baru
- **Expected Result**:
  - File ter-upload ke R2
  - Field `User.image` & `TeknisiProfile.coverImage` ter-update dengan URL R2
  - Preview baru tampil
- **Postconditions**:
  - Profil publik (`/teknisi/[slug]`) menampilkan gambar baru
- **References**: `src/lib/r2-storage.ts`, `src/app/api/teknisi/profile/...`

### FT-STR-003 — Tambah portfolio case
- **Role**: TEKNISI
- **Priority**: P1
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
- **Test Data**:
  - `title`: `Battery health restore`
  - `meta`: `iPhone 13 · 60 menit`
  - `result`: `Health 100%, charging cycle reset`
  - `imageUrl`: hasil upload
- **Steps**:
  1. Buka `/teknisi/portfolio` atau bagian portfolio di profil
  2. Klik "Tambah Case"
  3. Upload gambar + isi title/meta/result
  4. Submit
- **Expected Result**:
  - TeknisiPortfolioCase tercipta
  - Tampil di urutan baru di profil publik teknisi
- **Postconditions**:
  - `sortOrder` otomatis di-set
- **References**: `src/components/teknisi/teknisi-public-profile-view.tsx`, model `TeknisiPortfolioCase`

### FT-STR-004 — Update gallery toko
- **Role**: TEKNISI
- **Priority**: P1
- **Preconditions**:
  - Login `ahmad@indoteknizi.com` (punya store APPROVED)
- **Test Data**: 3 file foto suasana toko
- **Steps**:
  1. Buka `/teknisi/toko/edit`
  2. Section Gallery → klik "Tambah Foto"
  3. Upload 3 file
- **Expected Result**:
  - Field `gallery` (array URL R2) ter-update
  - Foto tampil di halaman publik toko
- **Postconditions**:
  - Bisa drag-reorder atau hapus foto satu-satu
- **References**: `src/lib/teknisi-store-*.ts`

### FT-STR-005 — Update journey timeline
- **Role**: TEKNISI
- **Priority**: P2
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
- **Test Data**:
  - Journey baru: `2026 — Ekspansi Jakarta Selatan`
- **Steps**:
  1. Buka `/teknisi/toko/edit`
  2. Section Journey → klik "Tambah Milestone"
  3. Isi year + title + description + icon
- **Expected Result**:
  - JSON `journey` ter-update di `TeknisiStore`
  - Timeline tampil di halaman publik
- **Postconditions**: tidak ada
- **References**: model `TeknisiStore.journey` (Json)

### FT-STR-006 — Update operating hours
- **Role**: TEKNISI
- **Priority**: P1
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
- **Test Data**:
  - Senin-Jumat: 09:00-21:00
  - Sabtu: 10:00-18:00
  - Minggu: closed
- **Steps**:
  1. Buka `/teknisi/toko/edit`
  2. Section Jam Operasional
  3. Set toggle closed untuk Minggu, atur jam buka/tutup hari lain
  4. Simpan
- **Expected Result**:
  - Field `operatingHours` ter-update di TeknisiStore + TeknisiProfile (jika sinkron)
  - Halaman publik menampilkan jam hari ini + status "Buka/Tutup"
- **Postconditions**: tidak ada
- **References**: model `TeknisiStore.operatingHours`, `TeknisiProfile.operatingHours`

### FT-STR-007 — Submit listing produk untuk approval ADMIN
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
  - Store APPROVED + isPublished
- **Test Data**:
  - `name`: `iPhone 14 Pro - Second 256GB`
  - `category`: HANDPHONE
  - `price`: 12500000
  - `description`: deskripsi lengkap
  - `image`: URL upload
  - `stock`: 1
- **Steps**:
  1. Buka `/teknisi/produk/baru`
  2. Isi field
  3. Klik "Submit untuk Review"
- **Expected Result**:
  - Product tercipta dengan `listingStatus = PENDING`, `isPublished = false`
  - Notifikasi ADMIN
- **Postconditions**:
  - Produk belum tampil di marketplace publik sampai ADMIN approve (lihat domain `12-admin-governance.md`)
- **References**: `src/lib/marketplace-products.ts`, `src/app/api/teknisi/products/...`, model `Product` dengan `listingStatus`

## Negative Scenarios (GWTChecklist)

### FT-STR-101 — Aktivasi store dengan field wajib kosong ditolak [NEGATIVE]
- **Given**: TEKNISI login
- **When**: POST `/api/teknisi/store` dengan `name: ""`, `city: ""`, `address: ""`
- **Then**: Validasi Zod gagal, response HTTP 400 dengan list field error

### FT-STR-102 — Submit produk dengan harga ≤ 0 ditolak [NEGATIVE]
- **Given**: TEKNISI login (store APPROVED)
- **When**: POST `/api/teknisi/products` dengan `price: 0` atau `price: -100`
- **Then**: Validasi gagal, response HTTP 400, produk tidak tercipta

### FT-STR-103 — Upload gambar > 5 MB untuk cover ditolak [NEGATIVE]
- **Given**: TEKNISI login, file cover.jpg 8 MB
- **When**: TEKNISI upload file via form
- **Then**: Server menolak HTTP 413 atau validasi client menolak sebelum upload, file tidak tersimpan di R2

## Edge Cases (GWTChecklist)

### FT-STR-201 — Edit produk yang sedang PENDING approval [EDGE]
- **Given**: Product status `PENDING` dari TEKNISI
- **When**: TEKNISI mencoba edit harga produk tersebut
- **Then**: Edit dibolehkan namun status tetap PENDING (tidak otomatis APPROVED), atau edit ditolak hingga approval selesai (verifikasi di kode)

## RBAC Enforcement

### FT-STR-901 — USER mengakses /api/teknisi/store/* ditolak [RBAC]
- **Given**: USER `siti` login (role USER, bukan TEKNISI)
- **When**: USER PATCH `/api/teknisi/store/update` dengan payload valid
- **Then**: Response HTTP 403 `{ success: false, error: "Forbidden" }`, tidak ada perubahan store

## Catatan QA

- Implementasi: `src/lib/teknisi-store-*.ts`, `src/lib/teknisi-profile-*.ts`, `src/lib/marketplace-products.ts`
- API: `src/app/api/teknisi/store/`, `src/app/api/teknisi/profile/`, `src/app/api/teknisi/products/`
- Models: `TeknisiStore`, `TeknisiProfile`, `TeknisiPortfolioCase`, `Product`
- Storage gambar: R2 via `src/lib/r2-storage.ts`
