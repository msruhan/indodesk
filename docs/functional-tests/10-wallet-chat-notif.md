# Wallet, Chat, Notifications

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

File ini mencakup tiga sub-area horizontal yang dipakai semua role:

- **Wallet** — saldo internal (rupiah) untuk semua role; topup, withdraw, ledger transparan, manual adjustment oleh ADMIN.
- **Chat** — direct messaging antara USER dan TEKNISI di `ChatConversation` + `ChatMessage`.
- **Notifications** — `PlatformNotification` (in-app) dan integrasi Telegram (untuk ADMIN/TEKNISI bila link).

Setiap sub-area memiliki H2 sendiri di file ini agar tetap mudah ditelusuri.

## Cakupan Test

- Core Flow (DetailedTestCase): topup wallet (request + admin approve manual), withdraw, transfer internal (jika ada), kirim chat user→teknisi, terima platform notification, ADMIN top up manual ke USER/TEKNISI.
- Edge Flow (GWTChecklist): saldo kurang, nominal nol/negatif, withdraw concurrent, chat body kosong, chat melebihi limit karakter.
- RBAC: USER tidak boleh adjust saldo orang lain, hanya ADMIN.

## Wallet

### FT-WAL-SEC-001 — Withdraw melebihi daily limit ditolak
- **Role**: USER
- **Priority**: P1
- **Steps**: Set `WALLET_DAILY_WITHDRAW_LIMIT` rendah → withdraw di atas limit
- **Expected**: HTTP 400/403 `WALLET_LIMIT_EXCEEDED`

### FT-WAL-SEC-002 — Dual-control deposit (≥ threshold)
- **Role**: ADMIN (dua akun berbeda)
- **Priority**: P0
- **Steps**: Admin A request deposit manual ≥ `WALLET_DUAL_CONTROL_THRESHOLD` → approve tahap 1 → admin berbeda approve tahap 2
- **Expected**: Admin yang sama ditolak (`DUAL_CONTROL_SAME_ADMIN`); saldo naik setelah 2 approver

### FT-WAL-001 — USER request topup wallet (manual transfer)
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `dewi@gmail.com` (saldo Rp 100.000)
- **Test Data**:
  - Nominal: Rp 500.000
  - Bukti transfer: file image (≤ 2 MB)
- **Steps**:
  1. Buka `/user/wallet`
  2. Klik "Topup"
  3. Pilih nominal + metode transfer manual
  4. Upload bukti transfer
  5. Submit
- **Expected Result**:
  - Topup request tercipta dengan status `PENDING_APPROVAL`
  - File bukti tersimpan di R2
  - Notifikasi ADMIN
- **Postconditions**:
  - Saldo belum bertambah, menunggu ADMIN approve
- **References**: `src/lib/wallet-transactions.ts`, `src/app/api/wallet/topup/...`

### FT-WAL-002 — ADMIN approve topup → saldo bertambah
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**:
  - Login `admin@indoteknizi.com`
  - Topup request PENDING dari USER
- **Steps**:
  1. Buka `/admin/wallet/topup`
  2. Klik request PENDING
  3. Verifikasi bukti transfer
  4. Klik "Approve"
- **Expected Result**:
  - Status request `PENDING → APPROVED`
  - WalletLedger `DEPOSIT` untuk USER
  - Saldo USER bertambah
  - Notifikasi USER topup sukses
  - ActivityLog `payment.deposit.manual` tercatat
- **Postconditions**:
  - Saldo USER siap dipakai
- **References**: `src/app/api/admin/wallet/...`, `src/lib/activity-log.ts`

### FT-WAL-003 — ADMIN tambah saldo manual ke USER
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**:
  - Login `admin@indoteknizi.com`
  - Target: `siti@gmail.com`
- **Test Data**:
  - Nominal: Rp 500.000
  - Catatan: `Bonus referral`
- **Steps**:
  1. Buka `/admin/users`
  2. Klik USER target
  3. Klik "Tambah Saldo Manual"
  4. Isi nominal + catatan
  5. Konfirmasi
- **Expected Result**:
  - Saldo USER bertambah Rp 500.000
  - WalletLedger `DEPOSIT` (manual) tercipta
  - ActivityLog `payment.deposit.manual` (lihat seed sample)
  - Notifikasi USER
- **Postconditions**:
  - History wallet USER menampilkan entry deposit manual oleh ADMIN
- **References**: `src/lib/activity-log.ts`, `src/app/api/admin/wallet/manual-deposit/...`

### FT-WAL-004 — ADMIN tambah saldo manual ke TEKNISI
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**: Login `admin@indoteknizi.com`
- **Test Data**:
  - Target: `budi@indoteknizi.com`
  - Nominal: Rp 1.000.000
  - Catatan: `Bonus performa bulan Mei`
- **Steps**:
  1. Buka `/admin/users` → filter role TEKNISI
  2. Klik `budi`
  3. Klik "Tambah Saldo Manual"
  4. Isi nominal + catatan
  5. Konfirmasi
- **Expected Result**:
  - Saldo TEKNISI bertambah, WalletLedger DEPOSIT tercipta
  - Notifikasi TEKNISI
- **Postconditions**: TEKNISI bisa lihat saldo baru di `/teknisi/wallet`
- **References**: sama dengan FT-WAL-003

### FT-WAL-005 — USER request withdraw
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login `siti@gmail.com`, saldo ≥ Rp 100.000
  - Bank account tersimpan di profil (atau diisi saat withdraw)
- **Test Data**:
  - Nominal: Rp 100.000
  - Bank: BCA, no rekening: `1234567890`, atas nama: `Siti Nurhaliza`
- **Steps**:
  1. Buka halaman wallet user (dashboard / profil saldo)
  2. Klik "Tarik"
  3. Isi nominal + rekening tujuan
  4. Klik **Kirim OTP** → cek email (SMTP dikonfigurasi di Admin → Akun Saya → Pengaturan SMTP)
  5. Isi OTP email + MFA (jika 2FA aktif) atau password
  6. Submit
- **Expected Result**:
  - `WalletWithdrawRequest` tercipta status `PENDING`
  - Saldo USER langsung di-hold via ledger `ESCROW_HOLD` (-Rp 100.000)
  - SLA `slaDueAt` = now + 24 jam
  - OTP email single-use, kedaluwarsa 10 menit
- **Postconditions**:
  - ADMIN review request di Manajemen → Saldo → Penarikan
- **References**: `src/lib/wallet/withdraw.ts`, `src/app/api/wallet/withdraw/route.ts`

### FT-WAL-006 — ADMIN approve withdraw
- **Role**: ADMIN
- **Priority**: P0
- **Preconditions**:
  - Withdraw request PENDING ada
- **Steps**:
  1. Buka `/admin/management?tab=saldo` → sub-tab **Penarikan**
  2. Transfer manual ke rekening user (di luar sistem)
  3. Masukkan password admin → klik **Tandai selesai**
- **Expected Result**:
  - Status `PENDING → COMPLETED`
  - WalletLedger `WITHDRAWAL` (audit, amount 0 — saldo sudah di-hold)
  - Notifikasi USER (jika dikonfigurasi)
- **Postconditions**: tidak ada
- **References**: `src/app/api/admin/wallet/withdraw/[id]/route.ts`, `src/components/admin/admin-withdraw-panel.tsx`

### FT-WAL-007 — Lihat history wallet (ledger)
- **Role**: USER (atau TEKNISI / ADMIN — sesuai akun login)
- **Priority**: P1
- **Preconditions**:
  - Login dan punya minimal 3 entries di WalletLedger
- **Steps**:
  1. Buka `/user/wallet`
  2. Scroll riwayat transaksi
- **Expected Result**:
  - Riwayat menampilkan: jenis (DEPOSIT/DEBIT/EARNING/WITHDRAW/REFUND), nominal, deskripsi, timestamp, saldo setelahnya
  - Pagination jalan saat lebih dari 10 entries
- **Postconditions**: tidak ada
- **References**: `src/contexts/wallet-context.tsx`, `src/app/api/wallet/ledger/...`

## Chat

### FT-CHT-050 — USER kirim pesan ke TEKNISI
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - TEKNISI `ahmad@indoteknizi.com` aktif
- **Test Data**:
  - Pesan: `Halo, saya butuh bantuan unlock iPhone 13`
- **Steps**:
  1. Buka profil teknisi atau `/chat`
  2. Buka conversation dengan teknisi (atau buat baru)
  3. Tulis pesan di kolom chat
  4. Klik kirim (atau Enter)
- **Expected Result**:
  - ChatConversation dibuat (jika belum ada)
  - ChatMessage tersimpan dengan `senderId = userId` dan `body`
  - `lastMessageAt` di-update
  - Pesan tampil di kedua sisi (USER & TEKNISI) — real-time atau via polling
- **Postconditions**:
  - Conversation tampil di list chat kedua user
- **References**: `src/contexts/chat-context.tsx`, `src/hooks/use-chat-messenger.ts`, `src/app/api/chat/...`, model `ChatConversation`/`ChatMessage`

### FT-CHT-051 — TEKNISI balas pesan
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login `ahmad@indoteknizi.com`
  - Conversation aktif dengan unread message dari USER
- **Steps**:
  1. Buka `/teknisi/chat`
  2. Klik conversation dengan unread badge
  3. Tulis balasan
  4. Kirim
- **Expected Result**:
  - Pesan tersimpan dengan `senderId = teknisiId`
  - `readAt` pesan USER ter-update saat TEKNISI buka conversation
  - Pesan tampil di sisi USER
- **Postconditions**: tidak ada
- **References**: sama

### FT-CHT-052 — Lihat unread badge & mark as read
- **Role**: USER (atau TEKNISI)
- **Priority**: P1
- **Preconditions**:
  - Login (mis. `siti@gmail.com` atau `ahmad@indoteknizi.com`)
  - Ada conversation dengan pesan unread (`readAt = null`)
- **Steps**:
  1. Buka header app (lihat icon chat)
  2. Klik icon chat → list conversation
  3. Klik conversation
- **Expected Result**:
  - Badge tampil dengan jumlah unread
  - Saat conversation dibuka, semua pesan dari sisi lawan ter-mark `readAt`
  - Badge berkurang/hilang
- **Postconditions**: tidak ada
- **References**: `src/lib/chat-*.ts`

## Notifications

### FT-NOT-080 — USER terima platform notification
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Trigger event: order PAID, sesi konsultasi accepted, dll.
- **Steps**:
  1. Lakukan action yang trigger notif (mis. checkout marketplace)
  2. Buka icon bell di header
- **Expected Result**:
  - PlatformNotification tercipta dengan title, body, link, isRead=false
  - Badge bell menampilkan unread count
  - Saat notif dibuka, `isRead=true`
- **Postconditions**:
  - Click notif redirect ke link target
- **References**: `src/lib/platform-notifications.ts`, `src/hooks/use-platform-notifications.ts`, model `PlatformNotification`

### FT-NOT-081 — TEKNISI terima notif Telegram (jika linked)
- **Role**: TEKNISI
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `ahmad@indoteknizi.com` (sudah link akun Telegram)
  - Telegram bot dikonfigurasi (`TELEGRAM_*` env vars)
  - Trigger event: order baru / konsultasi baru
- **Steps**:
  1. Trigger event di sisi USER
  2. Cek Telegram TEKNISI
- **Expected Result**:
  - Pesan Telegram terkirim dengan ringkasan event + link
  - Notifikasi non-blocking (tidak menahan request asli)
- **Postconditions**:
  - Pesan Telegram berisi data yang benar
- **References**: `src/lib/telegram.ts`, `scripts/setup-telegram-webhook.sh`

### FT-NOT-082 — Mark all notifications as read
- **Role**: USER
- **Priority**: P2
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Ada ≥ 3 notif unread
- **Steps**:
  1. Buka panel notif
  2. Klik "Tandai semua dibaca"
- **Expected Result**:
  - Semua notif user `isRead=true`
  - Badge unread menjadi 0
- **Postconditions**: tidak ada
- **References**: `src/hooks/use-platform-notifications.ts`

## Negative Scenarios (GWTChecklist)

### FT-WAL-101 — Topup dengan nominal ≤ 0 ditolak [NEGATIVE]
- **Given**: USER `siti@gmail.com` login
- **When**: POST `/api/wallet/topup` dengan `amount: 0` atau `amount: -50000`
- **Then**: Validasi Zod gagal, response `{ success: false, error: <pesan> }` HTTP 400

### FT-WAL-102 — Topup melebihi batas atas (mis. > Rp 50 juta) ditolak [NEGATIVE]
- **Given**: USER login; batas atas topup di config Rp 50.000.000
- **When**: USER POST topup dengan `amount: 100000000` (100 juta)
- **Then**: Validasi gagal, response HTTP 400 dengan pesan "Nominal melebihi batas maksimum"

### FT-WAL-103 — Withdraw saat saldo kurang dari nominal ditolak [NEGATIVE]
- **Given**: USER `dewi` saldo Rp 100.000
- **When**: USER POST withdraw `amount: 200000`
- **Then**: Response `{ success: false, error: "Saldo tidak cukup" }` HTTP 400, tidak ada hold/withdraw record tercipta

### FT-CHT-150 — Kirim chat tanpa autentikasi ditolak [NEGATIVE]
- **Given**: Tidak ada session aktif
- **When**: POST `/api/chat/messages` dengan payload valid
- **Then**: Response HTTP 401, pesan tidak tersimpan

### FT-CHT-151 — Chat dengan body kosong ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/chat/messages` dengan `body: ""` atau `body: "   "` (whitespace only)
- **Then**: Validasi Zod gagal, response HTTP 400

### FT-NOT-180 — Mark notification milik user lain sebagai read ditolak [NEGATIVE]
- **Given**: USER `siti` login; ada PlatformNotification milik `rudi`
- **When**: PATCH notification milik `rudi` dengan session `siti`
- **Then**: Response HTTP 403 atau 404, status notification tidak berubah

## Edge Cases (GWTChecklist)

### FT-WAL-201 — Concurrent withdraw dari saldo yang sama [EDGE]
- **Given**: USER saldo Rp 1.000.000 (cukup hanya untuk satu withdraw Rp 700.000)
- **When**: USER mengirim dua request withdraw Rp 700.000 hampir bersamaan (selisih < 100 ms)
- **Then**: Hanya satu withdraw yang sukses; yang kedua ditolak `{ success: false, error: "Saldo tidak cukup" }` HTTP 409, hold tetap konsisten via Prisma `$transaction`

### FT-CHT-251 — Chat body melebihi batas karakter ditolak [EDGE]
- **Given**: USER login; batas chat misalnya 2000 karakter
- **When**: USER POST chat dengan body 3000 karakter
- **Then**: Validasi gagal, response HTTP 400 dengan pesan batas karakter, pesan tidak tersimpan

## RBAC Enforcement

### FT-WAL-901 — USER tambah saldo manual ke akun lain ditolak [RBAC]
- **Given**: USER `siti` login (bukan ADMIN)
- **When**: POST `/api/admin/wallet/manual-deposit` dengan target `dewi.id`
- **Then**: Response HTTP 403 `{ success: false, error: "Forbidden" }`, saldo tidak berubah

### FT-CHT-950 — USER baca conversation bukan miliknya ditolak [RBAC]
- **Given**: ChatConversation antara `siti` ↔ `ahmad`
- **When**: USER `rudi` (bukan partisipan) mencoba GET conversation tersebut
- **Then**: Response HTTP 403, conversation tidak terbaca

### FT-NOT-970 — Akses notif user lain ditolak [RBAC]
- **Given**: PlatformNotification milik `siti`
- **When**: USER `rudi` mencoba GET notif tersebut
- **Then**: Response HTTP 403 atau 404, notif tidak terbaca

## Catatan QA

- Wallet: `src/lib/wallet-transactions.ts`, `src/contexts/wallet-context.tsx`, `src/app/api/wallet/`, `src/app/api/admin/wallet/`
- Chat: `src/contexts/chat-context.tsx`, `src/hooks/use-chat-messenger.ts`, `src/app/api/chat/`
- Notifications: `src/lib/platform-notifications.ts`, `src/hooks/use-platform-notifications.ts`, `src/lib/telegram.ts`
- Activity log untuk wallet manual deposit: lihat seed `payment.deposit.manual` di `prisma/seed.ts`
- Models: `Wallet`, `WalletLedger`, `ChatConversation`, `ChatMessage`, `PlatformNotification`
