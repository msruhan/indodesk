# Stress Test — IndoTeknizi MVP

Skenario stress test untuk soft launch IndoTeknizi.

**Reference spec**: `docs/superpowers/specs/2026-05-25-stress-test-design.md`
**Implementation plan**: `docs/superpowers/plans/2026-05-25-stress-test-implementation.md`

## Prasyarat

1. **k6 terinstall**

   ```bash
   brew install k6
   ```

2. **Database PostgreSQL jalan**

   ```bash
   npm run db:up
   ```

3. **Seed stress data**

   ```bash
   npm run stress:seed
   ```

   Membuat 30 user + 20 teknisi dengan email pattern `*@indoteknizi.test`.

4. **Dev server dengan stress mode aktif**

   ```bash
   STRESS_TEST_MODE=true npm run dev
   ```

   Penting: tanpa flag, mock external API tidak aktif → bot Telegram, BinderByte, DhruFusion akan di-hit beneran.

## Eksekusi

| Skenario | Command | Durasi |
|----------|---------|-------:|
| Smoke (sanity check) | `npm run stress:smoke` | 30 detik |
| S1 Public Discovery | `npm run stress:1` | ~7 menit |
| S2 Marketplace Checkout | `npm run stress:2` | ~8 menit |
| S3 Service Request | `npm run stress:3` | ~6 menit |
| S4 Realtime Polling | `npm run stress:4` | ~10 menit |
| S5 Soak Test | `npm run stress:soak` | 30 menit |
| Semua kecuali soak | `npm run stress:all` | ~31 menit |

## Workflow Standar

```bash
# Terminal 1: dev server dengan stress mode
STRESS_TEST_MODE=true npm run dev

# Terminal 2: monitoring
bash stress-test/monitor.sh

# Terminal 3: jalankan test
npm run stress:smoke   # sanity check dulu
npm run stress:1       # baru full skenario
```

## Cleanup

Setelah selesai semua test:

```bash
npm run stress:clean
```

Hapus semua user/data dengan email `*@indoteknizi.test`.

## Threshold Pass/Fail

Lihat spec §3.2 dan §7.3.

| Skenario | PASS | FAIL |
|----------|------|------|
| S1 | P95 < 800ms, errors < 1% | P95 > 1.5s atau errors > 5% |
| S2 | Zero failed checkout, P95 < 1.5s | Wallet inconsistency |
| S3 | Notif terkirim, P95 < 1s | Activity log block |
| S4 | DB conn < 8/10, P95 < 500ms | Pool exhausted |
| S5 | RSS drift ±10MB | Drift > 50MB |

## Production Safety

- `STRESS_TEST_MODE` HARUS tidak di-set di production env
- Internal endpoints `/api/stress-internal/*` return 404 jika flag tidak set
- Verifikasi via curl post-deploy:
  ```bash
  curl -o /dev/null -w "%{http_code}\n" https://indoteknizi.com/api/stress-internal/memory
  # Expected: 404
  ```

## Troubleshooting

**Login fail di k6** — pastikan seed sudah dijalankan, password default `StressTest123!`.

**Connection refused** — dev server belum jalan.

**Mock tidak aktif** — env `STRESS_TEST_MODE=true` belum di-set saat start dev server.

**404 di `/api/stress-internal/memory`** — sama, flag belum aktif.

**k6: command not found** — `brew install k6` belum dijalankan.

**Build error setelah modifikasi mock** — cek type assertion di `binderbyte-client.ts` & `dhru-fusion.ts`.

## File Structure

```
stress-test/
├── README.md                      # ini
├── plan.md                        # ringkasan
├── monitor.sh                     # helper monitoring
├── config/
│   └── thresholds.js              # shared k6 thresholds
├── lib/
│   ├── auth.js                    # k6 login helper
│   └── data.js                    # random data picker
├── scenarios/
│   ├── 01-public-discovery.js
│   ├── 02-marketplace-checkout.js
│   ├── 03-service-request.js
│   ├── 04-realtime-polling.js
│   └── 05-soak-test.js
├── seed/
│   ├── stress-seed.ts             # buat 30 user + 20 teknisi
│   └── clean.ts                   # hapus *@indoteknizi.test
└── results/
    ├── REPORT_TEMPLATE.md         # template laporan hasil
    └── .gitkeep
```
