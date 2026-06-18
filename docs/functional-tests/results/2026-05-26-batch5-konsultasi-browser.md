# Batch 5 — Konsultasi Browser Test Report — 2026-05-26

**Mode**: Cursor browser + API (`scripts/run-konsultasi-ft.ts`)  
**Base URL**: http://localhost:3000  
**Akun**: `siti@gmail.com`, `ahmad@indoteknizi.com`, `budi@indoteknizi.com`, `dewi@gmail.com`, `admin@indoteknizi.com` / `password123`

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 10 |
| ⚠️ PARTIAL | 0 |
| ⏭️ BLOCKED | **0** |
| ❌ FAIL | 0 |

**API**: 10/10 PASS — [`2026-05-26-batch5-konsultasi-api.md`](./2026-05-26-batch5-konsultasi-api.md)

---

## Hasil per skenario

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| FT-KON-001 | USER booking konsultasi | ✅ PASS | Profil Ahmad → **Book Consultation** → **Konsultasi Unlock** → **Bayar Rp 50.000** → muncul di `/user/konsultasi` status **Menunggu** |
| FT-KON-002 | Pembayaran via wallet | ✅ PASS | Saldo dipotong saat booking (dialog: *Saldo akan dipotong saat pesanan dibuat*); header wallet siti Rp 800.000 setelah beberapa sesi tes |
| FT-KON-003 | TEKNISI accept → ACTIVE | ✅ PASS | Login `ahmad@` → `/teknisi/konsultasi` → **Mulai** pada baris **Menunggu** → status **Berjalan** |
| FT-KON-004 | TEKNISI mark COMPLETED | ✅ PASS | **Selesai** pada sesi berjalan → status **Selesai**; earning teknisi diverifikasi API |
| FT-KON-005 | USER review setelah COMPLETED | ✅ PASS | Login siti → `/user/konsultasi` → **Rating** → 5 bintang + ulasan → **Kirim** |
| FT-KON-101 | Booking tanpa auth | ✅ PASS | API 401 (guest tidak bisa POST `/api/user/konsultasi`) |
| FT-KON-102 | teknisiId tidak ada | ✅ PASS | API 404 *Teknisi tidak ditemukan* |
| FT-KON-103 | Saldo kurang | ✅ PASS | API 402 *Saldo tidak cukup*; handler: batalkan sesi aktif dulu, lalu `adminSetWalletBalance(dewi, 10k)` |
| FT-KON-201 | Cancel ACTIVE → refund utuh | ✅ PASS | API: cancel setelah `start` mengembalikan saldo penuh; UI tombol **Batal** pada status **Berjalan** |
| FT-KON-901 | RBAC teknisi lain | ✅ PASS | API 403 saat `budi` mencoba `start` sesi milik `ahmad` |

---

## Perubahan kode (batch 5)

1. **Pembatalan PENDING & ACTIVE** + refund wallet di `src/app/api/user/konsultasi/[id]/route.ts` dan `src/app/api/teknisi/konsultasi/[id]/route.ts`.
2. **RBAC teknisi**: sesi bukan milik teknisi → **403** (bukan 404).
3. **404 booking**: pesan *Teknisi tidak ditemukan* pada `POST /api/user/konsultasi`.
4. **`canCancel`**: juga `true` untuk status `ACTIVE` di `user-konsultasi-serializer.ts`.
5. **FT**: `scripts/ft/handlers/konsultasi.ts`, `bookKonsultasiSession()` / `getConsultationBookBody()` di `scripts/ft/lib.ts`, runner `scripts/run-konsultasi-ft.ts` (prep saldo siti & dewi sebelum run).

---

## Setup yang dilakukan

- `npx tsx scripts/run-konsultasi-ft.ts` — 10/10 PASS
- Browser: alur end-to-end siti → Ahmad (book) → Ahmad teknisi (mulai/selesai) → siti (rating)
- Negatif & edge: diverifikasi via API runner (sesuai pola batch 3–4)

---

## Catatan QA

- Pembayaran konsultasi terjadi **saat POST booking** (bukan langkah bayar terpisah); UI menampilkan **Bayar Rp …** di dialog booking.
- Aksi teknisi di UI: **Mulai** = `action: 'start'`, **Selesai** = `action: 'complete'`.
- Untuk FT-KON-103: urutan penting — **batalkan sesi pending/active dulu**, baru set saldo rendah (cancel meng-refund dan bisa mengacaukan assert saldo).
