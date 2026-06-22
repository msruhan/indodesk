# IndoDesk ↔ Bantoo Sync — Design Spec

**Tanggal**: 2026-06-22  
**Status**: Implemented (Fase 0–2)  
**Opsi**: B — custom IndoDesk + relay publik RustDesk  

## Ringkasan

Sinkronisasi IndoDesk dengan web Bantoo agar remote hanya bisa lewat sesi konsultasi berbayar (enforcement di client IndoDesk resmi).

## Fase 0 — OTP dinamis + deep link

- Booking hanya wajib **IndoDesk ID** (tanpa OTP)
- OTP 6 digit di-generate saat teknisi **Mulai** sesi
- OTP di-clear saat sesi selesai/dibatalkan
- Deep link teknisi: `indodesk://{id}?password={otp}`
- Deep link user: `indodesk://password/{otp}`

## Fase 1 — Device pairing

- Model `IndodeskDevice`, `IndodeskPairingCode`
- `IndodeskDownload` per `platform` + `role` (user/teknisi)
- API: `/api/indodesk/pair/init`, `/pair/confirm`, `/devices`, `/heartbeat`

## Fase 2 — Authorization

- `POST /api/indodesk/authorize` — validasi sesi ACTIVE + OTP
- `GET /api/indodesk/session-grant` — grant bertanda untuk deep link
- Hook Rust: `bantoo_auth.rs` (outgoing login + incoming accept)
- Heartbeat IndoDesk → `/api/indodesk/heartbeat` dengan Bearer token
- UI pairing di web (`/remote`) dan IndoDesk desktop

## Batasan

- Relay publik RustDesk tidak memblokir RustDesk stock — fokus IndoDesk saja
- Deep link password desktop user terbatas (mobile lebih lengkap); user bisa salin OTP manual

## Deploy checklist

1. `npx prisma migrate deploy` di production
2. Set `api-server` di `custom.txt` build IndoDesk ke domain Bantoo
3. Build 2 variant: `conn-type: incoming` (user), `outgoing` (teknisi)
4. Upload binary ke admin Download IndoDesk (4 entri: win/mac × user/teknisi)
