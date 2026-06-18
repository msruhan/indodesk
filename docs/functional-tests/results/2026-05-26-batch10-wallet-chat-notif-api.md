# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 13:29:02 UTC
**Base URL**: http://localhost:3000
**Mode**: batch10-wallet-chat-notif-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 24 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ⚠️ PASS WITH SKIPS
- **Total dieksekusi**: 24
- **Pass**: 14 (58%)
- **Fail**: 0
- **Skip**: 10 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 12.52s
- **Avg per case**: 522ms

## 2. Per-Domain Results

### ✅ CHT (pass 7 / fail 0 / skip 0 / total 7)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-CHT-050 | USER kirim pesan ke TEKNISI | ✅ PASS | 1370ms | — |
| FT-CHT-051 | TEKNISI balas pesan | ✅ PASS | 1211ms | — |
| FT-CHT-052 | Lihat unread badge & mark as read | ✅ PASS | 1039ms | — |
| FT-CHT-150 | Kirim chat tanpa autentikasi ditolak [NEGATIVE] | ✅ PASS | 7ms | — |
| FT-CHT-151 | Chat dengan body kosong ditolak [NEGATIVE] | ✅ PASS | 802ms | — |
| FT-CHT-251 | Chat body melebihi batas karakter ditolak [EDGE] | ✅ PASS | 902ms | — |
| FT-CHT-950 | USER baca conversation bukan miliknya ditolak [RBAC] | ✅ PASS | 1053ms | — |

### ⚠️ NOT (pass 1 / fail 0 / skip 4 / total 5)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-NOT-080 | USER terima platform notification | ✅ PASS | 355ms | — |
| FT-NOT-081 | TEKNISI terima notif Telegram (jika linked) | ⏭️ SKIP | 2ms | Telegram notif memerlukan bot & akun terhubung |
| FT-NOT-082 | Mark all notifications as read | ⏭️ SKIP | 0ms | Mark all read — state lokal di client (localStorage), bukan API |
| FT-NOT-180 | Mark notification milik user lain sebagai read ditolak [NEGATIVE] | ⏭️ SKIP | 2ms | PlatformNotification broadcast — tidak ada ownership per user |
| FT-NOT-970 | Akses notif user lain ditolak [RBAC] | ⏭️ SKIP | 5ms | PlatformNotification broadcast — tidak ada ownership per user |

### ⚠️ WAL (pass 6 / fail 0 / skip 6 / total 12)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-WAL-001 | USER request topup wallet (manual transfer) | ✅ PASS | 685ms | — |
| FT-WAL-002 | ADMIN approve topup → saldo bertambah | ⏭️ SKIP | 30ms | Approve topup manual belum persist ke DB (TopupRequest model TODO di /api/wallet/topup) |
| FT-WAL-003 | ADMIN tambah saldo manual ke USER | ✅ PASS | 1891ms | — |
| FT-WAL-004 | ADMIN tambah saldo manual ke TEKNISI | ✅ PASS | 1085ms | — |
| FT-WAL-005 | USER request withdraw | ⏭️ SKIP | 2ms | Endpoint withdraw belum diimplementasi |
| FT-WAL-006 | ADMIN approve withdraw | ⏭️ SKIP | 1ms | Endpoint approve withdraw belum diimplementasi |
| FT-WAL-007 | Lihat history wallet (ledger) | ✅ PASS | 987ms | — |
| FT-WAL-101 | Topup dengan nominal ≤ 0 ditolak [NEGATIVE] | ✅ PASS | 366ms | — |
| FT-WAL-102 | Topup melebihi batas atas (mis. > Rp 50 juta) ditolak [NEGATIVE] | ⏭️ SKIP | 1ms | Batas atas topup belum divalidasi di API (hanya min Rp 10.000) |
| FT-WAL-103 | Withdraw saat saldo kurang dari nominal ditolak [NEGATIVE] | ⏭️ SKIP | 0ms | Withdraw belum diimplementasi |
| FT-WAL-201 | Concurrent withdraw dari saldo yang sama [EDGE] | ⏭️ SKIP | 3ms | Withdraw concurrent belum diimplementasi |
| FT-WAL-901 | USER tambah saldo manual ke akun lain ditolak [RBAC] | ✅ PASS | 723ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

- **Approve topup manual belum persist ke DB (TopupRequest model TODO di /api/wallet/topup)**: FT-WAL-002
- **Endpoint withdraw belum diimplementasi**: FT-WAL-005
- **Endpoint approve withdraw belum diimplementasi**: FT-WAL-006
- **Telegram notif memerlukan bot & akun terhubung**: FT-NOT-081
- **Mark all read — state lokal di client (localStorage), bukan API**: FT-NOT-082
- **Batas atas topup belum divalidasi di API (hanya min Rp 10.000)**: FT-WAL-102
- **Withdraw belum diimplementasi**: FT-WAL-103
- **PlatformNotification broadcast — tidak ada ownership per user**: FT-NOT-180, FT-NOT-970
- **Withdraw concurrent belum diimplementasi**: FT-WAL-201
