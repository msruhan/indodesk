# Security Hardening — Production Readiness Checklist

Checklist final sebelum deploy production setelah Wave 0–10.

## 1. Build & tests

| Check | Command | Status |
|-------|---------|--------|
| Unit tests | `npm run test` | 31 tests (vitest) |
| Production build | `npm run build` | Wajib hijau |
| Lint (opsional) | `npm run lint` | |

## 2. Database migrations

Terapkan semua migration Prisma (termasuk security):

```bash
npm run db:migrate   # dev
# production:
npx prisma migrate deploy
```

Migration keamanan penting:

- `20260526220000_security_wave3_tokens_sessions` — reset token, sessions, TelegramLinkToken
- `20260526230000_wallet_deposit_dual_control`
- `20260526230100_wallet_ledger_append_only`

## 3. Environment variables (production)

Salin dari `.env.example` dan isi nilai production:

| Variable | Wajib prod | Catatan |
|----------|------------|---------|
| `AUTH_SECRET` | Ya | ≥32 karakter, bukan placeholder / prefix `dev-` |
| `DATA_ENCRYPTION_KEY` | Ya | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Ya | Origin utama (CSRF + CORS) |
| `CORS_ALLOWED_ORIGINS` | Disarankan | Comma-separated jika multi-origin |
| `UPSTASH_REDIS_REST_*` | Disarankan | Rate limit + TOTP replay multi-instance |
| SMTP (Admin → Akun Saya) | Disarankan | OTP withdraw, forgot password, verifikasi email |
| `CRON_SECRET` | Ya (jika pakai cron HTTP) | `openssl rand -base64 32` |
| `CRON_SECRET_OLD` | Opsional | Saat rotasi cron |
| `TELEGRAM_WEBHOOK_SECRET` | Ya (jika Telegram) | Sama dengan `secret_token` di setWebhook |
| `R2_PRIVATE_*` | Disarankan | Foto inspeksi / media sensitif |
| `WALLET_DUAL_CONTROL_THRESHOLD` | Opsional | Default 5 juta IDR |
| `CSP_ENFORCE` | Opsional | `true` setelah 1 minggu report-only |

**Jangan** set di production:

- `STRESS_TEST_MODE=true` — startup akan throw

## 4. Post-deploy sekali

```bash
# Enkripsi rahasia plaintext yang sudah ada di DB
npm run secrets:encrypt
```

Uji manual:

- Login + 2FA (TOTP & backup code)
- Forgot password → reset link
- Admin sync IMEI API (kunci terenkripsi)
- Upload foto inspeksi → URL `/api/media/private/...`
- Telegram link (webhook + secret header)
- Cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/imei-orders`

## 5. Operasional

```bash
npm run secrets:rotate   # generate nilai baru + instruksi rollout
```

Rotasi `DATA_ENCRYPTION_KEY` **tidak** otomatis — butuh re-encrypt manual.

## 6. Smoke & functional tests

```bash
npm run dev   # terminal 1
npx tsx scripts/functional-smoke-test.ts
# atau full: TMPDIR=.tmp npm run test:ft:full
```

Suite security smoke: `FT-SEC-001` … `FT-SEC-004` di `scripts/functional-smoke-test.ts`.

## 7. Rollout notes

- CSP default **report-only**; set `CSP_ENFORCE=true` setelah monitoring.
- Dual-control deposit: admin butuh **dua** approver berbeda untuk nominal besar.
- Setelah deploy Wave 8, jalankan `secrets:encrypt` sebelum traffic production penuh.

## 8. Deploy VPS (co-host dengan Nexus)

Lihat [docs/deploy/VPS-COHOST-NEXUS.md](../deploy/VPS-COHOST-NEXUS.md) untuk:

- `Dockerfile` + `docker-compose.production.yml`
- Routing Caddy multi-site bersama Nexus
- Runbook reinstall Nexus via Hermes tanpa menghapus data IndoTeknizi

CI/CD (GHCR + auto-deploy): [docs/deploy/CI-CD.md](../deploy/CI-CD.md)
