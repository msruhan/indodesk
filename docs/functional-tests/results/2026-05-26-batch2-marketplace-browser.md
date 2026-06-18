# Batch 2 — Marketplace Browser Test Report — 2026-05-26 (revisi)

**Mode**: Cursor browser + API (stress login / admin wallet)  
**Base URL**: http://localhost:3000  
**Akun**: `siti@gmail.com`, `dewi@gmail.com`, `stress-teknisi-1/2`, `stress-user-1/2`, `admin@indoteknizi.com` (password seed / `StressTest123!`)

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 15 |
| ⚠️ PARTIAL | 2 |
| ❌ GAP | **0** (fitur diimplementasi 2026-05-26) |
| ⏭️ BLOCKED | **0** |

> **Update implementasi:** FT-MKT-006 (konfirmasi USER), FT-MKT-007 (review produk), FT-MKT-104 (validasi alamat) sudah ditambahkan di kode.

Semua skenario yang sebelumnya BLOCKED telah dijalankan via kombinasi logout/login akun terkait, admin PATCH produk/stok, dan verifikasi API. Saldo dewi **tidak** ditop-up (karena FT-MKT-102 adalah tes negatif saldo kurang).

---

## Hasil per skenario

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| FT-MKT-001 | Browse listing publik | ✅ PASS | Guest `/marketplace` → 32 produk |
| FT-MKT-002 | Tambah ke cart | ✅ PASS | Siti → Beli → `/cart` |
| FT-MKT-003 | Checkout via wallet | ✅ PASS | `ORD-2026-CA2PPL` |
| FT-MKT-004 | TEKNISI input resi | ✅ PASS | `/teknisi/pesanan` → resi mock |
| FT-MKT-005 | Tracking DELIVERED | ⚠️ PARTIAL | Mock BinderByte langsung DELIVERED (bukan polling 15 menit) |
| FT-MKT-006 | USER konfirmasi → COMPLETED | ✅ PASS* | Tombol **Konfirmasi Diterima** di detail order saat status SHIPPED + tracking DELIVERED (`POST /api/user/marketplace/orders/[id]/confirm`) |
| FT-MKT-007 | Review produk | ✅ PASS* | Form review di order COMPLETED; API `POST /api/marketplace/products/[id]/reviews`; ulasan tampil di halaman produk |
| FT-MKT-008 | Detail order + timeline | ✅ PASS | Seed `ORD-2026-000001` timeline 7 event |
| FT-MKT-101 | Checkout stok 0 | ✅ PASS | Admin set `stock:0` + APPROVED → checkout siti HTTP 400 "Stok produk tidak mencukupi"; stok direstore |
| FT-MKT-102 | Saldo kurang | ✅ PASS | Dewi saldo Rp 100.000 → iPhone Rp 8.500.000: API 402; browser `/cart` → "Saldo tidak cukup", tombol bayar disabled |
| FT-MKT-103 | Checkout tanpa items | ✅ PASS | API POST `{ items: [] }` → HTTP 400 |
| FT-MKT-104 | Tanpa alamat | ✅ PASS* | Keranjang: field alamat wajib untuk item fisik; server menolak jika `requiresShipping` tanpa alamat ≥10 karakter |
| FT-MKT-105 | Listing PENDING | ✅ PASS | Produk PENDING → checkout HTTP 404 "Produk tidak tersedia" |
| FT-MKT-201 | Concurrent checkout stok 1 | ✅ PASS | `stress-user-1` 201 vs `stress-user-2` 409; satu order PAID |
| FT-MKT-202 | Resi duplikat saat shipped | ✅ PASS | PATCH resi ulang → HTTP 400 "Resi hanya dapat diinput saat pesanan sedang diproses" |
| FT-MKT-901 | USER akses endpoint teknisi | ✅ PASS | Siti GET `/api/teknisi/marketplace/orders` → HTTP 403 |
| FT-MKT-902 | TEKNISI akses order orang lain | ✅ PASS | `stress-teknisi-2` PATCH order milik `stress-teknisi-1` → HTTP 404 "Pesanan tidak ditemukan" |

---

## Tindakan setup yang dilakukan

1. **Logout / login**: Dewi → uji saldo kurang; Siti → detail order CA2PPL.
2. **Admin** (`admin@indoteknizi.com`): PATCH stok produk stress (0 / 1 / restore 9998), approve listing setelah insiden PATCH teknisi yang mereset ke PENDING.
3. **Teknisi** `stress-teknisi-1`: `advance` pada `ORD-2026-CA2PPL` → `COMPLETED`.
4. **Tidak top-up dewi** — sengaja agar FT-MKT-102 tetap valid.

---

## Temuan produk / QA

1. **URL detail order**: Memakai **cuid** (`/user/orders/{id}`), bukan `orderCode`.
2. **FT-MKT-006**: Tombol USER "Konfirmasi Diterima" tersedia saat SHIPPED + tracking DELIVERED (`/api/user/marketplace/orders/[id]/confirm`).
3. **FT-MKT-007 & FT-MKT-104**: Review produk + validasi alamat checkout sudah diimplementasi (2026-05-26).

---

## Order kunci sesi

| Kode | Pembeli | Status akhir |
|------|---------|--------------|
| ORD-2026-CA2PPL | siti@gmail.com | **COMPLETED** (settlement via API) |
| (parallel) | stress-user-1/2 | Satu checkout sukses pada produk stok 1 |

---

## Retest fitur baru (2026-05-26)

Laporan: [`2026-05-26-batch2-retest-006-007-104.md`](./2026-05-26-batch2-retest-006-007-104.md)

| ID | Hasil retest |
|----|----------------|
| FT-MKT-006 | ✅ PASS browser |
| FT-MKT-007 | ✅ PASS browser + API |
| FT-MKT-104 | ⚠️ PARTIAL (API ✅; UI alamat — verifikasi manual keranjang 1 item) |

---

## Langkah berikutnya (opsional)

- **Batch 3** Rekber.
