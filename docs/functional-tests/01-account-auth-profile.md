# Account / Auth / Profile

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Domain ini mencakup seluruh siklus akun pengguna pada IndoTeknizi: registrasi, login (credentials & Google OAuth), 2FA TOTP, lupa password, manajemen profil, foto/avatar, ubah password, sesi, dan logout. Semua role (USER, TEKNISI, ADMIN) memakai pipeline auth yang sama lewat NextAuth.js dengan strategi JWT.

Khusus untuk role TEKNISI, login melewati `checkTeknisiLoginGuard` yang memvalidasi `verificationStatus` profil — akun teknisi yang `PENDING` atau `REJECTED` ditolak. Domain ini juga menjadi prasyarat banyak skenario di domain lain (DomainDoc lain merujuk preconditions login dari sini).

## Cakupan Test

- Core Flow (DetailedTestCase): registrasi USER, login credentials, login Google OAuth, aktivasi 2FA TOTP, login dengan 2FA, lupa password, update profil, ubah avatar, ubah password, logout.
- Edge Flow (GWTChecklist): rate limiting login gagal, password lemah, email duplikat saat register, sesi expired.
- RBAC: redirect Guest ke `/login` dengan `callbackUrl`.

## Detailed Test Cases

### FT-AUTH-001 — Registrasi USER baru
- **Role**: Guest → USER
- **Priority**: P0
- **Preconditions**:
  - Belum ada akun dengan email target (mis. `qa-baru@gmail.com`)
  - Database ter-seed (lihat OverviewDoc) — tidak boleh konflik dengan email seed (`siti@gmail.com`, `rudi@gmail.com`, `dewi@gmail.com`)
- **Test Data**:
  - Nama: `QA Baru`
  - Email: `qa-baru@gmail.com`
  - Password: `Strong#Pass1`
  - Phone: `+62 812-9999-9999`
- **Steps**:
  1. Buka `/register`
  2. Isi semua field (nama, email, password, phone)
  3. Centang persetujuan (jika ada)
  4. Klik tombol "Daftar"
- **Expected Result**:
  - Form lolos validasi Zod, request POST ke `/api/auth/register` mengembalikan `{ success: true }`
  - Akun baru tercipta di tabel `User` dengan role `USER` dan password ter-hash bcrypt
  - Wallet baru dibuat dengan saldo Rp 0
  - User otomatis diarahkan ke halaman dashboard USER atau halaman login (sesuai konfigurasi)
- **Postconditions**:
  - User bisa login menggunakan kredensial baru
- **References**: `src/lib/auth-utils.ts`, `src/app/api/auth/register/route.ts`, `prisma/schema.prisma` (User, Wallet)

### FT-AUTH-002 — Login dengan credentials (USER)
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Akun seed `siti@gmail.com` aktif
- **Test Data**:
  - Email: `siti@gmail.com`
  - Password: `password123`
- **Steps**:
  1. Buka `/login`
  2. Isi email dan password
  3. Klik tombol "Masuk"
- **Expected Result**:
  - Session JWT terbentuk, cookie `__Secure-next-auth.session-token` (atau `next-auth.session-token` di dev) di-set
  - Redirect ke `/user/dashboard` atau halaman utama USER
  - ActivityLog mencatat `auth.login.success`
- **Postconditions**:
  - User1 bisa mengakses semua halaman USER-only
- **References**: `src/lib/auth-utils.ts`, `src/lib/api-auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`

### FT-AUTH-003 — Login dengan credentials (TEKNISI yang APPROVED)
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Akun seed `ahmad@indoteknizi.com` aktif dengan TeknisiProfile `isVerified: true`
- **Test Data**:
  - Email: `ahmad@indoteknizi.com`
  - Password: `password123`
- **Steps**:
  1. Buka `/login`
  2. Isi email dan password
  3. Klik "Masuk"
- **Expected Result**:
  - `checkTeknisiLoginGuard` lolos
  - Redirect ke `/teknisi/dashboard`
  - Sidebar TEKNISI tampil dengan menu Toko, Listing, Konsultasi, dst.
- **Postconditions**:
  - TEKNISI dapat mengakses `/api/teknisi/*`
- **References**: `src/lib/auth-utils.ts` (checkTeknisiLoginGuard)

### FT-AUTH-004 — Login dengan Google OAuth
- **Role**: Guest → USER
- **Priority**: P1
- **Preconditions**:
  - `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET` ter-set di env
  - Akun Google QA tersedia (jangan pakai email yang sama dengan seed `siti@gmail.com`)
- **Test Data**: akun Google QA team
- **Steps**:
  1. Buka `/login`
  2. Klik tombol "Masuk dengan Google"
  3. Pilih akun Google
  4. Setujui consent screen
- **Expected Result**:
  - User baru tercipta di `User` (jika belum ada) dengan role default `USER`
  - Wallet otomatis dibuat
  - Redirect ke dashboard USER
- **Postconditions**:
  - Akun Google ter-link di tabel `Account` (provider=google)
- **References**: `src/app/api/auth/[...nextauth]/route.ts` (Google provider config)

### FT-AUTH-005 — Aktivasi 2FA TOTP
- **Role**: USER (atau TEKNISI/ADMIN)
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Belum mengaktifkan 2FA
  - Authenticator app tersedia (Google Authenticator/Authy/1Password)
- **Test Data**:
  - Kode TOTP 6 digit yang di-generate authenticator app dari secret yang baru
- **Steps**:
  1. Buka halaman pengaturan keamanan akun
  2. Klik tombol "Aktifkan 2FA"
  3. Scan QR code dengan authenticator app
  4. Masukkan kode 6 digit dari app ke form verifikasi
  5. Simpan kode backup (jika ditampilkan)
- **Expected Result**:
  - `twoFactorSecret` tersimpan di User (encrypted/plain sesuai implementasi)
  - `twoFactorEnabled = true`
  - Notifikasi sukses tampil
- **Postconditions**:
  - Login berikutnya akan minta kode TOTP
- **References**: `src/lib/totp.ts`, `src/app/api/auth/2fa/...`

### FT-AUTH-006 — Login dengan 2FA aktif
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - 2FA sudah diaktifkan untuk `siti@gmail.com` (lihat FT-AUTH-005)
  - Authenticator app menampilkan kode aktif
- **Test Data**:
  - Email: `siti@gmail.com`
  - Password: `password123`
  - Kode TOTP: 6 digit dari app
- **Steps**:
  1. Buka `/login`
  2. Isi email + password, klik "Masuk"
  3. Halaman verifikasi 2FA muncul
  4. Masukkan kode 6 digit
  5. Klik "Verifikasi"
- **Expected Result**:
  - Setelah verifikasi sukses, session terbentuk dan redirect ke dashboard
  - Jika kode salah → tampil pesan "Kode tidak valid" dan tetap di halaman 2FA
- **Postconditions**:
  - Session aktif
- **References**: `src/lib/totp.ts` (verifikasi window ±30 detik)

### FT-AUTH-007 — Lupa password (request reset)
- **Role**: Guest
- **Priority**: P1
- **Preconditions**:
  - Akun seed `rudi@gmail.com` aktif
- **Test Data**:
  - Email: `rudi@gmail.com`
- **Steps**:
  1. Buka `/login`
  2. Klik link "Lupa password?"
  3. Masukkan email akun
  4. Submit form
- **Expected Result**:
  - Response `{ success: true }` muncul terlepas dari apakah email exist (untuk hindari user enumeration)
  - VerificationToken baru dibuat di DB dengan token random + expiry
  - Email reset terkirim (jika SMTP dikonfigurasi) atau token tampil di log dev
- **Postconditions**:
  - Token dapat dipakai sekali untuk reset password di `/reset-password?token=...`
- **References**: `src/app/api/auth/forgot-password/...`, `prisma/schema.prisma` (VerificationToken)

### FT-AUTH-008 — Update profil (nama & telepon)
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
- **Test Data**:
  - Nama baru: `Siti N.`
  - Phone baru: `+62 812-3333-1111`
- **Steps**:
  1. Buka `/user/account` atau halaman profil
  2. Edit field Nama dan Telepon
  3. Klik "Simpan"
- **Expected Result**:
  - PATCH request ke `/api/user/account` mengembalikan `{ success: true }`
  - Field tersebut ter-update di DB
  - Toast notifikasi sukses muncul
- **Postconditions**:
  - Halaman menampilkan data baru setelah refresh
- **References**: `src/lib/auth-utils.ts`, `src/app/api/user/account/...`

### FT-AUTH-009 — Ubah avatar / foto profil
- **Role**: USER
- **Priority**: P2
- **Preconditions**:
  - Login sebagai `dewi@gmail.com`
  - File gambar tersedia (JPG/PNG ≤ 2 MB, contoh: `avatar.jpg`)
- **Test Data**: file `avatar.jpg`
- **Steps**:
  1. Buka halaman profil
  2. Klik avatar / tombol "Ubah Foto"
  3. Pilih file gambar
  4. Tunggu upload selesai
- **Expected Result**:
  - File ter-upload ke R2 (URL `https://<r2-host>/...`)
  - Field `User.image` ter-update dengan URL R2
  - Avatar baru tampil di header dan profil
- **Postconditions**:
  - File lama (jika ada) tetap ada di R2 (cleanup terpisah) atau di-delete sesuai implementasi
- **References**: `src/lib/r2-storage.ts`, `src/lib/media-storage.ts`, `src/app/api/upload/...`

### FT-AUTH-010 — Ubah password (saat login)
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `rudi@gmail.com`
- **Test Data**:
  - Password lama: `password123`
  - Password baru: `BaruKuat#1`
- **Steps**:
  1. Buka pengaturan keamanan akun
  2. Klik "Ubah Password"
  3. Isi password lama + password baru + konfirmasi
  4. Submit
- **Expected Result**:
  - Validasi password lama lolos
  - Password baru di-hash dan tersimpan
  - ActivityLog mencatat `account.password.changed`
  - User di-redirect ke login (atau session dipertahankan, sesuai implementasi)
- **Postconditions**:
  - Login berikutnya wajib pakai password baru
- **References**: `src/app/api/account/password/...`, `src/lib/activity-log.ts`

### FT-AUTH-011 — Logout
- **Role**: USER (atau lainnya)
- **Priority**: P0
- **Preconditions**:
  - Session aktif (mis. login sebagai `siti@gmail.com`)
- **Steps**:
  1. Klik avatar di header → menu dropdown
  2. Klik "Logout"
- **Expected Result**:
  - Cookie session dihapus
  - Redirect ke `/login` atau `/`
  - ActivityLog mencatat `auth.logout`
- **Postconditions**:
  - Akses ke halaman authenticated → redirect ke `/login`
- **References**: NextAuth `signOut`

## Negative Scenarios (GWTChecklist)

### FT-AUTH-101 — Register dengan email duplikat ditolak [NEGATIVE]
- **Given**: Email `siti@gmail.com` sudah terdaftar di User
- **When**: Guest submit form register dengan email yang sama
- **Then**: Sistem menolak dengan response `{ success: false, error: "Email sudah digunakan" }` HTTP 400 dan tidak ada User baru tercipta

### FT-AUTH-102 — Register dengan password lemah ditolak [NEGATIVE]
- **Given**: Guest membuka `/register`
- **When**: Guest submit dengan `password: "123"` (gagal validasi Zod minimal length / kompleksitas)
- **Then**: Response `{ success: false, error: <pesan zod> }` HTTP 400 dan field password ditandai error di UI

### FT-AUTH-103 — Login dengan kredensial salah ditolak [NEGATIVE]
- **Given**: Akun `siti@gmail.com` ada
- **When**: Guest submit login dengan password salah `wrong-password`
- **Then**: Response gagal HTTP 401, ActivityLog `auth.login.failed` tercatat dengan IP & userAgent, redirect tetap di `/login` dengan pesan "Email atau password salah"

### FT-AUTH-104 — Login TEKNISI yang verificationStatus PENDING ditolak [NEGATIVE]
- **Given**: Akun TEKNISI dengan `TeknisiProfile.verificationStatus = PENDING` ada
- **When**: TEKNISI mencoba login dengan kredensial benar
- **Then**: `checkTeknisiLoginGuard` menolak, response gagal dengan pesan "Akun teknisi belum disetujui", session tidak terbentuk

### FT-AUTH-105 — Update profil tanpa autentikasi ditolak [NEGATIVE]
- **Given**: Tidak ada cookie session
- **When**: Request PATCH ke `/api/user/account` dengan payload valid
- **Then**: Response HTTP 401 `{ success: false, error: "Unauthorized" }` dan tidak ada perubahan di database

### FT-AUTH-106 — Ubah password dengan password lama salah ditolak [NEGATIVE]
- **Given**: USER login sebagai `rudi@gmail.com`
- **When**: Submit ubah password dengan password lama yang salah
- **Then**: Response `{ success: false, error: "Password lama tidak cocok" }` HTTP 400 dan password tidak berubah

## Security Hardening (baru)

### FT-AUTH-301 — Lupa password (anti-enumeration)
- **Role**: Guest
- **Priority**: P0
- **Steps**: POST `/api/auth/forgot-password` dengan email valid/invalid + header `Origin` allowlist
- **Expected**: Selalu `{ success: true }`; email terkirim hanya jika akun ada

### FT-AUTH-302 — Reset password token sekali pakai
- **Role**: Guest → USER
- **Priority**: P0
- **Steps**: Minta reset → buka link `?resetToken=` → set password baru → ulangi token sama
- **Expected**: Percobaan kedua ditolak; `passwordChangedAt` ter-update; sesi lama invalid

### FT-AUTH-303 — Account lockout setelah 5 gagal login
- **Role**: Guest
- **Priority**: P1
- **Steps**: 5× login gagal untuk email sama dalam 15 menit → percobaan ke-6
- **Expected**: HTTP 429/403 lockout; `User.lockedUntil` terisi

### FT-AUTH-304 — Backup codes 2FA
- **Role**: USER dengan 2FA aktif
- **Priority**: P1
- **Steps**: Enable 2FA → simpan backup codes → login dengan `bc:XXXX-XXXX` → ulangi kode sama
- **Expected**: Kode cadangan hanya bisa dipakai sekali

### FT-AUTH-305 — Email verified gate (checkout/topup)
- **Role**: USER belum verifikasi email
- **Priority**: P1
- **Steps**: Coba checkout marketplace / topup / rekber
- **Expected**: HTTP 403 dengan pesan verifikasi email

## Edge Cases (GWTChecklist)

### FT-AUTH-201 — Rate limit setelah 5 percobaan login gagal [EDGE]
- **Given**: Tidak ada login gagal sebelumnya dari IP X
- **When**: Lima percobaan login gagal berturut-turut dari IP X dalam 15 menit untuk email yang sama
- **Then**: Percobaan ke-6 ditolak HTTP 429 dengan pesan rate limit, ActivityLog severity `CRITICAL` `auth.suspicious.brute_force` tercatat (lihat seed sample), dan IP di-block sementara

### FT-AUTH-202 — Login dengan kode TOTP expired ditolak [EDGE]
- **Given**: 2FA aktif untuk USER, kode TOTP yang dipakai sudah lewat window 30 detik (drift)
- **When**: USER submit kode TOTP basi
- **Then**: Verifikasi gagal, pesan "Kode tidak valid", tetap di halaman 2FA — perlu kode baru

### FT-AUTH-203 — Sesi expired auto-redirect ke login [EDGE]
- **Given**: Cookie session sudah expired (atau dihapus)
- **When**: USER mengakses halaman authenticated `/user/wallet`
- **Then**: Redirect ke `/login?callbackUrl=/user/wallet`, setelah login sukses redirect kembali ke halaman semula

## RBAC Enforcement

### FT-AUTH-901 — Guest mengakses halaman authenticated [RBAC]
- **Given**: Tidak ada session aktif
- **When**: Guest mengakses `/user/wallet`, `/teknisi/dashboard`, atau `/admin/users`
- **Then**: Redirect ke `/login?callbackUrl=<path>`, dan setelah login user dikembalikan ke path yang diminta jika role-nya cocok

### FT-AUTH-902 — Token reset password dipakai dua kali [RBAC]
- **Given**: VerificationToken untuk reset password baru saja dipakai sukses
- **When**: Token yang sama dipakai lagi untuk reset password
- **Then**: Response `{ success: false, error: "Token tidak valid atau sudah digunakan" }` HTTP 400, password tidak berubah

## Catatan QA

- Implementasi auth core: `src/lib/auth-utils.ts`, `src/lib/api-auth.ts`, `src/lib/totp.ts`
- Endpoint utama: `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/...`, `src/app/api/account/password/...`
- Activity logging: `src/lib/activity-log.ts` mencatat `auth.login.success`, `auth.login.failed`, `auth.logout`, `account.password.changed`, `account.register`
- Rate limit: `src/lib/rate-limit.ts` (default 5 percobaan / 15 menit untuk login)
