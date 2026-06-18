# IndoTeknizi — Product Backlog

Dokumen ini memetakan status fitur (real / parsial / mock), epic per area menu, dan checklist implementasi.  
Diperbarui: **Mei 2026** — audit codebase `indoteknizi/` (sinkron post-S6).

## Legenda status

| Simbol | Arti |
|--------|------|
| ✅ | Sudah terhubung DB/API, dipakai production path |
| 🟡 | Parsial (campuran real + mock / localStorage / fallback) |
| 🔴 | Mock / statis / UI saja |
| ⬜ | Belum ada |
| ⏸️ | Sengaja ditunda (keputusan produk) |

## Legenda prioritas

| Level | Makna |
|-------|--------|
| **P0** | Blocker bisnis inti — harus sebelum go-live penuh |
| **P1** | Monetisasi & trust utama |
| **P2** | Operasional & insight |
| **P3** | Polish & marketing |
| **P4** | Nice-to-have |

---

## Status sprint (snapshot)

| Sprint | Epic | Status | Catatan |
|--------|------|--------|---------|
| **S1** | K — Konsultasi user E2E | ✅ **Selesai (inti)** | API user + booking profil teknisi + `/user/konsultasi`; QA manual & rating marketplace terpisah |
| **S2** | R — Rekber escrow | ✅ **Selesai (inti)** | API + wallet + UI; QA staging manual belum dicentang |
| **S3** | T — Remote user | ✅ **Selesai** | Submit user + flow teknisi + riwayat |
| **S4** | M — Marketplace checkout | ✅ **Selesai** | Checkout wallet, orders user/teknisi |
| **S5** | A — Analytics & dashboard | 🟡 **Selesai (parsial)** | Agregat DB; export CSV & filter periode belum |
| **S6** | P + C — Topup + konten | 🟡 **Selesai (parsial)** | Topup wallet + banner/settings/help; gateway QRIS/VA belum |
| **S7+** | X + sisa C | 🟡 **Berjalan** | Toko publik, badge approval ✅; KYC, unify riwayat, rating belum |

**Posisi saat ini:** Post-S6 — fokus **Epic X** (polish, trust) + **sisa Epic C** (KYC).  
**Ditunda:** notifikasi WhatsApp / Telegram (in-app bell tetap dipakai).

### Rekomendasi kerja berikutnya (urutan)

1. **QA manual** — Rekber full cycle + konsultasi E2E di staging
2. **Epic C** — KYC teknisi (upload + approval)
3. **Epic X** — Konsolidasi `/user/history` → `/user/riwayat`; rating & review
4. **Epic A** — Export CSV laporan + filter periode dashboard
5. **Epic P** — Gateway topup (VA/webhook) — jika keluar dari scope wallet-only
6. **Epic X (P4)** — SSE/WebSocket, email transaksional, smart search

---

## Ringkasan eksekutif

| Area | Real | Parsial | Mock / ditunda |
|------|------|---------|----------------|
| Auth & 2FA | ✅ | — | — |
| Wallet / Saldo | ✅ | — | — |
| Chat | ✅ | — | — |
| IMEI & Server | ✅ | — | — |
| Management admin | ✅ | — | — |
| Approval (produk/teknisi/toko) | ✅ | badge dinamis | — |
| Monitoring admin | ✅ | — | — |
| Log aktivitas | ✅ | — | — |
| Teknisi: toko, produk, pesanan, konsultasi, remote | ✅ | — | — |
| Konsultasi user | ✅ | riwayat unify | `/user/history` masih mock |
| Rekber end-to-end | ✅ | — | QA manual staging |
| Marketplace katalog & checkout | ✅ | detail fallback mock | — |
| Topup | ✅ wallet | gateway/VA | promo rules DB |
| Dashboard & laporan | ✅ agregat DB | export CSV, filter periode | chart fallback mock |
| Banner, settings, help FAQ | ✅ | — | — |
| Toko publik | ✅ | — | — |
| Notifikasi eksternal | — | in-app ✅ | ⏸️ WA / Telegram |

---

## Peta menu → status saat ini

### Publik

| Menu / halaman | Route | Status | Catatan |
|----------------|-------|--------|---------|
| Landing | `/` | 🟡 | Testimoni/stat statis |
| Marketplace | `/marketplace`, `/shop` | ✅ | API produk |
| Detail produk | `/marketplace/[id]` | 🟡 | Fallback `MOCK_MARKETPLACE_PRODUCTS` |
| Keranjang | `/cart` | ✅ | Checkout potong saldo wallet |
| Toko | `/toko` | ✅ | `GET /api/stores` |
| Detail toko | `/toko/[id]` | ✅ | `GET /api/stores/[id]` + produk seller |
| Daftar teknisi | `/teknisi` | ✅ | `/api/teknisi` |
| Profil teknisi | `/teknisi/[id]` | ✅ | `GET /api/teknisi/[id]` + booking konsultasi |
| Remote | `/remote` | ✅ | API submit + teknisi online dari DB |
| Rekber | `/rekber` | ✅ | API + form + list (login) |
| Top Up | `/topup`, `/topup/[slug]` | ✅ | Bayar saldo wallet; QRIS/VA belum |
| IMEI | `/imei` | ✅ | |
| Lowongan | `/lowongan` | ✅ | |
| Login / Register | `/login`, `/register` | ✅ | Termasuk 2FA |

### Admin (`/admin/*`)

| Menu | Route | Status |
|------|-------|--------|
| Dashboard | `/admin/dashboard` | ✅ |
| Management | `/admin/management` | ✅ |
| Services | `/admin/produk` | 🟡 |
| IMEI & Server | `/admin/imei` | ✅ |
| Approval | `/admin/approval` | ✅ badge pending dinamis |
| Monitoring | `/admin/monitoring` | ✅ |
| Log Aktivitas | `/admin/logs` | ✅ |
| Banner | `/admin/banners` | ✅ |
| Notifikasi | `/admin/notifications` | ✅ Prisma broadcast |
| IndoDesk | `/admin/indodesk` | ✅ |
| Lowongan | `/admin/lowongan` | ✅ |
| Laporan | `/admin/laporan` | 🟡 export CSV belum |
| Transaksi | `/admin/transactions` | ✅ (belum di sidebar) |
| Akun Saya | `/admin/settings` | ✅ 2FA + platform settings |
| Help | `/admin/help` | ✅ CRUD FAQ + `/admin/help/preview` |
| Chat | `/admin/chat` | ✅ |

### Teknisi (`/teknisi/*`)

| Menu | Route | Status |
|------|-------|--------|
| Dashboard | `/teknisi/dashboard` | ✅ |
| Toko | `/teknisi/toko` | ✅ |
| Iklan Produk | `/teknisi/produk` | ✅ cuplikan pesanan + link ke Pesanan |
| Pesanan | `/teknisi/pesanan` | ✅ marketplace seller (proses, resi, lacak) |
| Konsultasi | `/teknisi/konsultasi` | ✅ |
| Remote | `/teknisi/remote` | ✅ |
| Riwayat / Saldo | `/teknisi/saldo` | ✅ |
| Analitik | `/teknisi/analitik` | ✅ |
| Akun | `/teknisi/settings` | ✅ |
| KYC | (profil) | 🔴 placeholder |
| Help | `/teknisi/help` | ✅ `GET /api/help?audience=teknisi` |

### User (`/user/*`)

| Menu | Route | Status |
|------|-------|--------|
| Dashboard | `/user/dashboard` | ✅ |
| Riwayat | `/user/riwayat` | 🟡 tab layanan real; unify `/user/history` belum |
| Saldo | `/user/saldo` | ✅ |
| Akun | `/user/akun` | ✅ |
| Chat | `/user/chat` | ✅ |
| Orders | `/user/orders` | ✅ marketplace dari API |
| Konsultasi | `/user/konsultasi` | ✅ `GET/PATCH /api/user/konsultasi` |
| Rekber | `/user/rekber` | ✅ |
| History | `/user/history` | 🔴 duplikat mock — redirect/unify belum |
| Help | `/user/help` | ✅ `GET /api/help?audience=user` |

---

# Epic K — Konsultasi user end-to-end (P0) — ✅ Selesai (inti)

**Tujuan:** User memesan konsultasi dari profil teknisi → bayar saldo → teknisi kerjakan → selesai + rating → riwayat & monitoring.

**Prasyarat yang sudah ada:**
- Model `KonsultasiSession` di Prisma
- API teknisi + user, wallet debit/refund/kredit teknisi
- `KonsultasiBookingDialog` di `/teknisi/[id]`
- Monitoring admin membaca konsultasi dari DB

### K1 — API user

- [x] `GET /api/user/konsultasi`
- [x] `POST /api/user/konsultasi` — debit wallet saat create
- [x] `GET /api/user/konsultasi/[id]`
- [x] `PATCH /api/user/konsultasi/[id]` — `cancel` (PENDING), `rate` (COMPLETED)
- [x] Validasi teknisi verified, layanan/harga, anti double PENDING
- [x] Activity log pada create / cancel / rate

### K2 — API publik

- [x] Layanan & harga di `GET /api/teknisi/[id]` (`services` dari `TeknisiProfile`)

### K3 — UI publik

- [x] `/teknisi/[id]` — API real + modal konsultasi
- [x] Redirect login jika belum auth; potong saldo setelah booking

### K4 — UI user dashboard

- [x] `/user/konsultasi` — fetch API, cancel, rating
- [ ] Redirect atau hapus `/user/history` (masih mock) → arahkan ke `/user/riwayat`
- [x] `/user/riwayat` — tab konsultasi dari API

### K5 — UI teknisi

- [x] PATCH status PENDING → ACTIVE → COMPLETED + kredit teknisi

### K6 — Admin & notifikasi

- [x] Monitoring & bell — konsultasi baru via agregat existing

### K7 — QA checklist

- [ ] User saldo cukup → buat → teknisi terima → selesai → rating (staging)
- [ ] User saldo tidak cukup → error 402
- [ ] Cancel PENDING
- [ ] Seed: minimal 1 sesi contoh

**DoD tercapai:** Tidak ada mock di `/user/konsultasi`; alur API lengkap. **Sisa:** QA manual + hapus `/user/history` mock.

---

# Epic R — Rekber escrow (P0) — ✅ Selesai (inti)

**Tujuan:** Escrow buyer → hold → release/dispute/refund + admin.

### R1 — API core

- [x] `POST/GET/PATCH /api/rekber`, `GET /api/rekber/[id]`
- [x] `POST /api/admin/rekber/[id]/resolve`
- [x] Wallet hold / release / refund + activity log

### R2 — UI publik & user

- [x] `/rekber`, `/user/rekber`, tab rekber di `/user/riwayat`
- [ ] Link rekber dari marketplace/order (fase lanjut)

### R3 — UI admin

- [x] `AdminApprovalRekberPanel`, `/admin/rekber`
- [x] Badge approval sidebar — `stats.pending` (termasuk item antrian rekber/produk/toko)

### R4 — QA

- [ ] Buyer fund → HELD → release
- [ ] Dispute → admin resolve
- [ ] Insufficient balance

**DoD:** Satu siklus penuh di staging tanpa hardcode (belum dicentang QA).

---

# Epic M — Marketplace checkout (P1) — ✅ Selesai

### M1 — Order & pembayaran

- [x] `Order` + `OrderItem`, `POST /api/marketplace/checkout`, wallet, activity log

### M2 — UI

- [x] `/cart`, `/user/orders`, `/user/riwayat` tab belanja, panel teknisi

### M3 — Admin

- [x] Order di `/admin/transactions`

---

# Epic T — Remote user + IndoDesk (P1) — ✅ Selesai

### T1 — API

- [x] `POST /api/remote`, `GET/PATCH /api/user/remote`, hubung teknisi PATCH

### T2 — UI

- [x] `/remote`, teknisi OTP, `/user/riwayat` tab remote

---

# Epic P — Topup pembayaran (P1) — 🟡 Parsial

- [x] Checkout saldo wallet — `POST /api/topup/checkout`
- [x] `TopupOrder`, promo/metode dari config server
- [x] Katalog dari DB, cek transaksi & halaman order
- [ ] Gateway / manual VA + webhook `TopupOrder.status`
- [ ] Promo rules di DB / admin panel

---

# Epic A — Analytics & dashboard real (P2) — 🟡 Parsial

### Admin

- [x] `/admin/dashboard` — `GET /api/admin/dashboard`
- [x] `/admin/laporan` — `GET /api/admin/laporan`
- [x] Chart props real + fallback `mock-analytics`
- [ ] Export CSV laporan
- [ ] Filter periode ↔ `dashboard-month-filter`

### Teknisi

- [x] `/teknisi/dashboard` & `/teknisi/analitik`

### User

- [x] `/user/dashboard`

---

# Epic C — Konten & platform (P2–P3) — 🟡 Parsial

### Banner

- [x] `MarketplaceBanner` + API admin/public + `banner-slider`buatkan 

### Notifikasi

- [x] Broadcast admin — Prisma + `/api/admin/notifications`
- [x] In-app bell — `GET /api/notifications`
- [⏸️] Email / WhatsApp / Telegram — **ditunda** (kartu "Belum link" di settings tetap UI placeholder)

### Platform settings

- [x] `PlatformSetting` + form `/admin/settings`

### Help / FAQ

- [x] `HelpArticle` + API + halaman help semua role
- [x] Admin CRUD `/admin/help` + pratinjau

### KYC teknisi

- [ ] Upload dokumen + review di Approval
- [ ] Sembunyikan block mock KYC di settings

---

# Epic X — Cross-cutting (P2–P4)

- [ ] **SSE/WebSocket** — notifikasi & chat
- [ ] **Email transaksional** — order, 2FA backup
- [ ] **Smart search** — index real-time (`dashboard-smart-search` ada, perlu perluasan)
- [x] **Sidebar badge Approval** — dinamis `stats.pending`
- [ ] **Konsolidasi riwayat user** — hapus/redirect `/user/history`, satu `/user/riwayat`
- [x] **Profil toko publik** — `GET /api/stores`, `/toko`, `/toko/[id]`
- [ ] **Rating & review** — marketplace (konsultasi: rate sesi sudah ada di API)
- [ ] **Withdrawal teknisi** — jika belum di wallet

---

# Checklist per menu (quick reference)

## Publik

- [ ] Landing — testimoni dinamis
- [x] Marketplace + cart checkout
- [x] Toko listing & detail
- [x] Teknisi profil + konsultasi booking
- [x] Remote submit
- [x] Rekber (QA manual)
- [x] Topup bayar saldo (gateway belum)

## Admin

- [x] Dashboard & laporan (export CSV belum)
- [x] Management, IMEI, approval, monitoring, logs
- [x] Banner, notifikasi broadcast, IndoDesk, lowongan
- [x] Settings platform + help CRUD
- [ ] Transaksi — pertimbangkan link di sidebar

## Teknisi

- [x] Dashboard, analitik, toko, produk, konsultasi, remote, saldo, help
- [ ] KYC

## User

- [x] Dashboard, saldo, akun, chat, orders, konsultasi, rekber, help
- [ ] Riwayat unify — hapus mock `/user/history`

---

# Urutan sprint (rencana vs aktual)

| Sprint | Fokus | Epic | Rencana | **Aktual** |
|--------|--------|------|---------|------------|
| **S1** | Konsultasi user E2E | K | 1–2 minggu | ✅ inti selesai |
| **S2** | Rekber escrow | R | 2 minggu | ✅ inti selesai |
| **S3** | Remote + riwayat | T | 1 minggu | ✅ (unify history sisa) |
| **S4** | Marketplace checkout | M | 2 minggu | ✅ |
| **S5** | Dashboard & laporan | A | 1 minggu | 🟡 |
| **S6** | Topup + banner/settings | P + C | 1–2 minggu | 🟡 |
| **S7+** | Polish & trust | X + KYC | — | 🟡 berjalan |

---

# Cara memakai dokumen ini

1. Lihat **Status sprint** untuk posisi besar-besaran.
2. Kerjakan item `[ ]` di epic **S7+** (Epic X, KYC, QA).
3. Centang `[ ]` → `[x]` setelah merge; update **Peta menu** jika status berubah.
4. Item ⏸️ tidak dijadwalkan kecuali keputusan produk berubah.

**File kunci (konsultasi):**
- `prisma/schema.prisma` — `KonsultasiSession`
- `src/app/api/user/konsultasi/*`, `src/app/api/teknisi/konsultasi/*`
- `src/lib/konsultasi-wallet.ts`, `src/lib/konsultasi-services.ts`
- `src/components/teknisi/konsultasi-booking-dialog.tsx`
- `src/app/user/konsultasi/page.tsx`, `src/app/teknisi/[id]/page.tsx`

**File kunci (toko publik):**
- `src/app/api/stores/route.ts`, `src/app/api/stores/[id]/route.ts`
- `src/components/toko/toko-detail-view.tsx`
