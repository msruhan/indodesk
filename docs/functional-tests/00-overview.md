---
title: Functional Test Scenarios — IndoTeknizi
version: 1.0.0
last_updated: 2026-05-26
audience: QA Team — Pre-Production Launch
---

# Functional Test Scenarios — IndoTeknizi

## Pendahuluan

Dokumen ini adalah paket **FunctionalTestDoc** untuk validasi pre-production launch platform IndoTeknizi. Audience utama adalah **tim QA** yang akan mengeksekusi skenario uji secara manual sebelum rilis. Berbeda dari dokumen stress test (lihat `indoteknizi/stress-test/results/`), paket ini fokus pada **kebenaran fungsional** alur bisnis, bukan performa.

Paket berisi **14 file**: satu OverviewDoc (file ini), dua belas DomainDoc per domain bisnis, dan satu CrossRoleDoc untuk skenario end-to-end lintas role. Setiap skenario di-tagging dengan `TestCaseID` unik agar mudah dirujuk dari issue tracker, regression report, atau RBAC matrix.

## Cakupan & Audience

- **In scope**: happy path, negative scenario (validasi gagal, payload kosong), edge case (concurrent access, error provider eksternal), RBAC enforcement lintas role, end-to-end flows.
- **Out of scope**: automated test code (Playwright/Vitest/Cypress). Paket ini murni dokumentasi manual.
- **Audience**: QA Engineer, QA Lead, Tech Lead/Reviewer, Security Reviewer.

## Prasyarat Lingkungan QA

Sebelum mengeksekusi skenario:

1. **Database** ter-seed dengan `npm run db:reset` lalu `npm run db:seed` (akan menghapus data lama dan mengisi akun seed di bawah).
2. **Server dev** berjalan: `npm run dev` di `indoteknizi/` (default `http://localhost:3000`).
3. **Env vars wajib** sudah di-set di `.env` (lihat `.env.example`):
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `R2_*` (untuk upload image — opsional jika tidak menguji upload)
   - `BINDERBYTE_API_KEY` (opsional, hanya untuk shipping tracking real)
4. **Prisma Studio** tersedia via `npm run db:studio` untuk inspeksi state database saat test.
5. **External provider mock** (DhruFusion IMEI, Server provider, Telegram) — gunakan `STRESS_TEST_MODE=true` untuk pakai stub built-in saat menguji error handling, atau matikan flag untuk pakai provider real.

## Konvensi Penulisan

### Format DetailedTestCase

Dipakai untuk **CoreFlow** (alur utama wajib lulus). Setiap test case wajib memiliki sembilan field:

```markdown
### FT-EXAMPLE-001 — Checkout marketplace via wallet
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com` (USER)
  - Saldo wallet ≥ Rp 8.500.000
  - Produk seed `iPhone 13 Pro Max - Second` tersedia (stok ≥ 1)
- **Test Data**:
  - `productId`: dari seed
  - `shippingAddress`: alamat default user1
- **Steps**:
  1. Buka `/marketplace`
  2. Klik produk seed
  3. Tambah ke cart, lanjut ke `/cart`
  4. Pilih payment method `Wallet`
  5. Klik tombol "Checkout"
- **Expected Result**:
  - Order tercipta dengan status `PAID`
  - Saldo wallet USER berkurang sesuai harga + ongkir
  - Notifikasi platform muncul di sisi USER dan TEKNISI
- **Postconditions**:
  - Order tampil di `/user/orders` dan `/teknisi/orders`
- **References**: `src/lib/marketplace-checkout.ts`, `src/app/api/marketplace/checkout/route.ts`
```

### Format GWTChecklist

Dipakai untuk **EdgeFlow** (negative, edge case, RBAC ringkas). Tiga klausa Given/When/Then eksplisit:

```markdown
### FT-EXAMPLE-104 — Checkout dengan stok 0 ditolak [NEGATIVE]
- **Given**: USER login dan punya saldo cukup; produk target memiliki `stock = 0`
- **When**: USER menekan tombol Checkout pada produk tersebut
- **Then**: Sistem menolak dengan response `{ success: false, error: "Stok tidak mencukupi" }` HTTP 400 dan tidak ada Order yang tercipta
```

### TestCaseID Convention

- Pola regex: `^FT-[A-Z]+-\d{3}$`
- Wajib **unik secara global** di seluruh 14 file paket.
- Range nomor per domain (lihat tabel di section TestCaseID Prefix di bawah).

### Priority Levels

| Level | Arti                                                                 |
| ----- | -------------------------------------------------------------------- |
| P0    | Blocker — happy path utama; wajib lulus sebelum rilis                |
| P1    | High — negative scenario penting + edge case yang sering terjadi     |
| P2    | Medium — small UX scenario (ubah foto, ubah nama tampilan, dst.)     |

### TestCaseID Prefix

| Domain                              | Prefix  | File                              |
| ----------------------------------- | ------- | --------------------------------- |
| Account / Auth / Profile            | `AUTH`  | `01-account-auth-profile.md`      |
| Marketplace                         | `MKT`   | `02-marketplace.md`               |
| Rekber                              | `RKB`   | `03-rekber.md`                    |
| Topup                               | `TOP`   | `04-topup.md`                     |
| Konsultasi                          | `KON`   | `05-konsultasi.md`                |
| Remote                              | `REM`   | `06-remote.md`                    |
| IMEI                                | `IMEI`  | `07-imei.md`                      |
| Server                              | `SRV`   | `08-server.md`                    |
| Inspection                          | `INS`   | `09-inspection.md`                |
| Wallet                              | `WAL`   | `10-wallet-chat-notif.md`         |
| Chat                                | `CHT`   | `10-wallet-chat-notif.md`         |
| Notifications                       | `NOT`   | `10-wallet-chat-notif.md`         |
| Teknisi Store / Portfolio           | `STR`   | `11-teknisi-store-portfolio.md`   |
| Admin Governance                    | `ADM`   | `12-admin-governance.md`          |
| Cross-Role End-to-End               | `CROSS` | `13-cross-role-flows.md`          |

## Role Matrix

`✓` = boleh akses, `—` = tidak boleh (akses → 401 / 403 / redirect login).

| Domain / Area Fungsional         | Guest | USER | TEKNISI | ADMIN | Endpoint Utama                                |
| -------------------------------- | :---: | :--: | :-----: | :---: | --------------------------------------------- |
| Marketplace browsing             |   ✓   |  ✓   |    ✓    |   ✓   | `/marketplace`, `/api/marketplace/products`   |
| Marketplace checkout             |   —   |  ✓   |    —    |   —   | `/api/marketplace/checkout`                   |
| Marketplace order management     |   —   |  ✓   |    ✓    |   ✓   | `/api/user/orders`, `/api/teknisi/orders`     |
| Rekber buyer flow                |   —   |  ✓   |    —    |   ✓   | `/api/rekber/*`                               |
| Topup checkout                   |   —   |  ✓   |    ✓    |   —   | `/api/topup/checkout`                         |
| Konsultasi booking               |   —   |  ✓   |    —    |   —   | `/api/konsultasi/book`                        |
| Konsultasi handling              |   —   |  —   |    ✓    |   ✓   | `/api/teknisi/konsultasi/*`                   |
| Remote session                   |   —   |  ✓   |    ✓    |   ✓   | `/remote`, `/api/remote/*`                    |
| IMEI service order               |   —   |  ✓   |    ✓    |   —   | `/api/imei/orders`                            |
| Server service order             |   —   |  ✓   |    ✓    |   —   | `/api/server/orders`                          |
| Inspection request               |   —   |  ✓   |    —    |   —   | `/api/inspection/request`                     |
| Inspection assignment & report   |   —   |  —   |    ✓    |   ✓   | `/api/teknisi/inspection/*`, `/api/admin/...` |
| Wallet topup/withdraw            |   —   |  ✓   |    ✓    |   ✓   | `/api/wallet/*`                               |
| Chat                             |   —   |  ✓   |    ✓    |   ✓   | `/api/chat/*`                                 |
| Notifications                    |   —   |  ✓   |    ✓    |   ✓   | `/api/notifications/*`                        |
| Teknisi store/portfolio          |   —   |  —   |    ✓    |   ✓   | `/api/teknisi/store/*`                        |
| Admin approvals & governance     |   —   |  —   |    —    |   ✓   | `/api/admin/*`, `/admin/*`                    |

## Seed Accounts

Sumber: `indoteknizi/prisma/seed.ts`. Password default semua akun: **`password123`** (bcrypt cost 12).

| Alias    | Email                     | Role    | Nama Tampilan        | Phone               | Saldo Wallet | Kegunaan Utama                                                      |
| -------- | ------------------------- | ------- | -------------------- | ------------------- | -----------: | ------------------------------------------------------------------- |
| admin    | `admin@indoteknizi.com`   | ADMIN   | Admin IndoTeknizi    | +62 812-0000-0001   | Rp 0         | Approval listing, RBAC enforcement, monitoring, ActivityLog         |
| teknisi1 | `ahmad@indoteknizi.com`   | TEKNISI | Ahmad Hidayat        | +62 812-1111-1111   | Rp 2.500.000 | Toko utama, listing produk, konsultasi, IMEI/Server, inspection     |
| teknisi2 | `budi@indoteknizi.com`    | TEKNISI | Budi Santoso         | +62 812-2222-2222   | Rp 1.800.000 | Skenario multi-teknisi (assignment, kompetisi listing)              |
| user1    | `siti@gmail.com`          | USER    | Siti Nurhaliza       | +62 812-3333-3333   | Rp 9.000.000 | Buyer utama: marketplace, rekber, konsultasi, IMEI                  |
| user2    | `rudi@gmail.com`          | USER    | Rudi Hartono         | +62 812-4444-4444   | Rp 250.000   | Skenario concurrent buyer dan dispute (saldo terbatas)              |
| user3    | `dewi@gmail.com`          | USER    | Dewi Lestari         | +62 812-5555-5555   | Rp 100.000   | Skenario topup, inspection, withdraw (saldo tipis)                  |

> Catatan: **TeknisiProfile** untuk `ahmad` dan `budi` di-seed dengan `isVerified: true` sehingga login lolos `checkTeknisiLoginGuard`. Toko `HandPhone Center Jakarta` (milik `ahmad`) berstatus `APPROVED` + `isPublished: true`.

## Default Test Data

Tabel referensi data uji yang sudah ada di seed:

| Kategori               | Sample Value                       | Sumber / Pemilik                                |
| ---------------------- | ---------------------------------- | ----------------------------------------------- |
| IMEI sample (sukses)   | `356938035643809`                  | IMEI Order seed `IMEI-2026-A1B2C3` milik user1  |
| IMEI sample (check)    | `353456789012345`                  | IMEI Order seed `IMEI-2026-D4E5F6` milik user2  |
| IMEI sample (pending)  | `867530012345678`                  | IMEI Order seed `IMEI-2026-G7H8I9` milik user1  |
| Order code marketplace | `ORD-2026-000001`                  | Order seed (status COMPLETED) milik user1       |
| Order code rekber      | `RKB-2026-000001`                  | RekberTransaction seed (status HELD) user2/budi |
| Order code server      | `SRV-2026-XYZ123`                  | ActivityLog seed (referensi)                    |
| Produk marketplace     | `iPhone 13 Pro Max - Second`       | Product seed milik teknisi1, harga Rp 8.500.000 |
| Produk marketplace     | `Samsung S21 Ultra - Refurbished`  | Product seed milik teknisi2, harga Rp 7.200.000 |
| Produk PENDING         | `Unlock Tool Premium License`      | Product seed milik teknisi1, listingStatus PENDING — untuk uji approval |
| Toko seed              | `HandPhone Center Jakarta`         | TeknisiStore milik teknisi1, listingStatus APPROVED |
| IMEI service utama     | Samsung Galaxy S24 Ultra Unlock    | ImeiService seed (Rp 150.000) — dipakai svc1    |
| Tracking number sample | `JNE1234567890`                    | Order seed `ORD-2026-000001`                    |
| Konsultasi seed        | `Konsultasi Unlock` COMPLETED      | KonsultasiSession user1 ↔ teknisi1 (Rp 50.000)  |
| Remote seed            | `987 654 321` WAITING              | RemoteSession user1 ↔ teknisi1                  |

## Tooling QA

| Tool                          | Cara Pakai                                        | Kegunaan                                          |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Prisma Studio                 | `npm run db:studio` (port 5555)                   | Inspeksi tabel, verifikasi state setelah action   |
| Reset DB                      | `npm run db:reset`                                | Kembali ke baseline seed                          |
| Seed ulang                    | `npm run db:seed`                                 | Re-seed tanpa reset (jarang dipakai)              |
| Server dev                    | `npm run dev`                                     | Jalankan app di `localhost:3000`                  |
| Build production              | `npm run build && npm run start`                  | Verifikasi skenario di mode production            |
| Browser DevTools              | F12 → Network/Console                             | Verifikasi response API dan error client          |

## Table of Contents

| #  | File                                                                  | Domain                              |
| -- | --------------------------------------------------------------------- | ----------------------------------- |
| 00 | [00-overview.md](./00-overview.md)                                    | Overview (file ini)                 |
| 01 | [01-account-auth-profile.md](./01-account-auth-profile.md)            | Account / Auth / Profile (`AUTH`)   |
| 02 | [02-marketplace.md](./02-marketplace.md)                              | Marketplace (`MKT`)                 |
| 03 | [03-rekber.md](./03-rekber.md)                                        | Rekber (`RKB`)                      |
| 04 | [04-topup.md](./04-topup.md)                                          | Topup (`TOP`)                       |
| 05 | [05-konsultasi.md](./05-konsultasi.md)                                | Konsultasi (`KON`)                  |
| 06 | [06-remote.md](./06-remote.md)                                        | Remote (`REM`)                      |
| 07 | [07-imei.md](./07-imei.md)                                            | IMEI Services (`IMEI`)              |
| 08 | [08-server.md](./08-server.md)                                        | Server Services (`SRV`)             |
| 09 | [09-inspection.md](./09-inspection.md)                                | Inspection (`INS`)                  |
| 10 | [10-wallet-chat-notif.md](./10-wallet-chat-notif.md)                  | Wallet + Chat + Notifications       |
| 11 | [11-teknisi-store-portfolio.md](./11-teknisi-store-portfolio.md)      | Teknisi Store / Portfolio (`STR`)   |
| 12 | [12-admin-governance.md](./12-admin-governance.md)                    | Admin Governance (`ADM`)            |
| 13 | [13-cross-role-flows.md](./13-cross-role-flows.md)                    | Cross-Role End-to-End (`CROSS`)     |
