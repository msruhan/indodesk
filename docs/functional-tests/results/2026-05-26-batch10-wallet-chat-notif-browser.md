# Batch 10 — Wallet, Chat, Notifications — 2026-05-26

**API**: [`2026-05-26-batch10-wallet-chat-notif-api.md`](./2026-05-26-batch10-wallet-chat-notif-api.md) — **14 PASS, 0 FAIL, 10 SKIP**

| Area | Runner |
|------|--------|
| Wallet | `TMPDIR=.tmp npx tsx scripts/run-wallet-chat-notif-ft.ts` |

**SKIP wajar**: withdraw belum ada API, approve topup belum persist DB, Telegram, mark-all-read client-side, notifikasi broadcast tanpa owner per-user.

**Perbaikan**: validasi chat body kosong/whitespace (`messages/route.ts`).
