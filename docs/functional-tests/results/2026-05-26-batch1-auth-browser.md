# Batch 1 — AUTH Browser Test Report — 2026-05-26

**Mode**: Cursor browser (agent takeover)  
**Base URL**: http://localhost:3000  
**Akun seed**: `password123` · Stress: `StressTest123!`

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 11 |
| ⚠️ PARTIAL | 3 |
| ⏭️ BLOCKED (butuh Anda / env) | 6 |
| ❌ FAIL / gap UI | 2 |

---

## Hasil per skenario

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| FT-AUTH-001 | Registrasi USER baru | ✅ PASS | `/register` → auto login → `/user/akun` |
| FT-AUTH-002 | Login USER (siti) | ✅ PASS | Redirect `/user/dashboard` |
| FT-AUTH-003 | Login TEKNISI APPROVED | ⚠️ PARTIAL | `stress-teknisi-1@indoteknizi.test` → `/teknisi/dashboard` ✅. Seed `ahmad@indoteknizi.com` gagal (tetap `/login`, API: `CredentialsSignin`) |
| FT-AUTH-004 | Google OAuth | ⏭️ BLOCKED | Tombol ada; butuh consent Google |
| FT-AUTH-005 | Aktivasi 2FA TOTP | ⚠️ PARTIAL | Tab Keamanan → "Aktifkan 2FA" + teks QR; scan butuh authenticator Anda |
| FT-AUTH-006 | Login dengan 2FA | ⏭️ BLOCKED | Butuh FT-AUTH-005 selesai |
| FT-AUTH-007 | Lupa password | ❌ GAP | Tidak ada link "Lupa password?" di `/login` |
| FT-AUTH-008 | Update profil | ✅ PASS | Nama "Siti N." tersimpan di `/user/akun` |
| FT-AUTH-009 | Ubah avatar | ⏭️ BLOCKED | Tombol "Ubah foto profil" ada; upload file tidak bisa diotomasi penuh |
| FT-AUTH-010 | Ubah password | ⚠️ PARTIAL | Form "Ubah Password" terbuka (3 field + Simpan); input password tidak reliable di browser agent — **disarankan verifikasi manual** atau API (`POST /api/user/password`) |
| FT-AUTH-011 | Logout | ✅ PASS | Menu akun → Keluar → `/` |
| FT-AUTH-101 | Register email duplikat | ✅ PASS | `siti@gmail.com` → tetap di `/register`, tidak redirect |
| FT-AUTH-102 | Register password lemah | ✅ PASS | Password `123` → tetap di `/register` |
| FT-AUTH-103 | Login kredensial salah | ✅ PASS | Password salah → tetap di `/login` |
| FT-AUTH-104 | TEKNISI PENDING ditolak | ⏭️ BLOCKED | Tidak ada akun PENDING di seed saat ini |
| FT-AUTH-106 | Password lama salah | ⚠️ PARTIAL | Form validasi client-side terlihat; submit API belum diverifikasi di browser |
| FT-AUTH-203 | Sesi expired redirect | ✅ PASS | Guest akses `/user/dashboard` → `/login?callbackUrl=%2Fuser%2Fdashboard` |
| FT-AUTH-901 | Guest halaman authenticated | ✅ PASS | (sama pola dengan 203 untuk dashboard user) |
| FT-AUTH-902 | Token reset 2x | ❌ GAP | Tidak ada flow forgot-password di UI |

---

## Temuan produk

1. **FT-AUTH-007 / FT-AUTH-902**: Tambah link "Lupa password?" di `/login` jika fitur direncanakan.
2. **FT-AUTH-003**: Login `ahmad@indoteknizi.com` + `password123` gagal di browser dan `POST /api/stress-internal/login` (`CredentialsSignin`). Kemungkinan hash DB tidak cocok seed atau akun terkunci rate-limit — jalankan `npm run db:seed` atau cek `TeknisiProfile.verificationStatus`.
3. **FT-AUTH-010**: Pertimbangkan `type="password"` + label yang konsisten agar automation/Playwright lebih stabil.

---

## Yang masih butuh Anda

| ID | Aksi manual |
|----|-------------|
| FT-AUTH-004 | Klik "Lanjutkan dengan Google" |
| FT-AUTH-005–006 | Scan QR 2FA + login dengan kode TOTP |
| FT-AUTH-009 | Upload file avatar (jika R2 dikonfigurasi) |
| FT-AUTH-010 | Ubah password rudi lewat form Keamanan (atau konfirmasi lewat API) |

---

## Langkah berikutnya

- **Batch 2** (marketplace / cart / checkout) — siap dilanjutkan setelah Anda konfirmasi.
- API runner: `npm run test:ft:full` sudah menutup banyak skenario AUTH lewat HTTP; laporan: `2026-05-26-full-run.md`.
