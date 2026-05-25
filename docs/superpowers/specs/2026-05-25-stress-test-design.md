# Stress Test Plan — IndoTeknizi (Soft Launch MVP)

**Tanggal**: 2026-05-25
**Status**: Spec Draft
**Author**: Brainstorming session via Kiro
**Target Release**: Soft Launch / MVP

---

## 1. Tujuan

Skenario stress test ini dirancang untuk fase soft launch IndoTeknizi dengan tiga tujuan, urut prioritas:

1. **Pre-launch validation** — memastikan aplikasi stabil di beban produksi MVP (10–30 concurrent users) sebelum deploy ke VPS.
2. **Bottleneck identification** — menemukan slow query, N+1 query, memory leak, blocking operations, dan hot endpoints.
3. **Capacity planning** — memperkirakan headroom dari mesin lokal ke target deployment VPS 1 vCPU / 2 GB RAM, dan kapan perlu scale up.

## 2. Scope & Konteks

### 2.1 Target Beban (MVP)

- ~50–300 registered users total
- ~10–30 concurrent users di peak hour
- ~2–5 transaksi marketplace per jam
- Profil traffic dominan: read-heavy (browsing) > polling > write (transaksi/service request)

### 2.2 Target Deployment (informasi konteks)

- VPS Linux 1 vCPU, 2 GB RAM, 40 GB storage
- Co-located atau separated DB (keputusan menyusul, mempengaruhi capacity rekomendasi)
- Estimasi RAM headroom: ~250 MB di peak load → memory leak detection penting

### 2.3 Lingkungan Test

- **Saat ini**: Local development di Mac (localhost:3000)
- **Database**: PostgreSQL via Docker Compose (`npm run db:up`)
- **External API**: di-mock untuk yang berisiko (lihat §4)
- **Tidak termasuk** dalam dokumen ini: testing langsung di VPS production (dapat menyusul setelah deploy awal)

### 2.4 Flow yang Di-cover

| Kode | Flow | Tipe Beban | Skenario |
|------|------|------------|----------|
| A | Public discovery (landing, marketplace, teknisi browsing, search) | Read-heavy | S1 |
| C | Marketplace transaction E2E (login → checkout → order) | Write-heavy | S2 |
| D | Service request (konsultasi, remote, inspeksi) | Mixed | S3 |
| E | Real-time polling (notifications, presence, chat) | Read-heavy persistent | S4 |
| (semua) | Long-running stability | Mixed konstan | S5 (soak) |

### 2.5 Flow yang TIDAK Di-cover (YAGNI)

- Authentication flow di luar login (register, 2FA verify, password reset) — frekuensi rendah di MVP
- Wallet & financial isolated test (sudah tercakup di S2)
- Teknisi dashboard analytics — internal tool, low concurrent
- Admin operations — internal tool, low concurrent
- Topup catalog & IMEI E2E — butuh external API critical path
- Distributed/multi-machine load testing — overkill untuk 30 VU
- Browser-based testing (Playwright, Lighthouse) — bisa menyusul setelah UI final
- CI integration — menunggu staging environment
- Chaos engineering (DB down, network partition) — terlalu advanced untuk MVP

## 3. Skema Beban

### 3.1 Empat Level Eskalasi

| Level | Kode | Concurrent Users (VU) | Tujuan |
|-------|------|----------------------:|--------|
| Smoke | L1 | 1 | Verifikasi flow tidak broken sebelum stress |
| Baseline | L2 | 10 | Beban normal MVP |
| Peak | L3 | 30 | Peak hour MVP target |
| Breaking point | L4 | scenario-specific | Cari titik degradasi (capacity planning) |

**Catatan tentang L4**: Breaking point berbeda per skenario karena cost profile berbeda. Skenario read-heavy (S1) bisa di-push sampai 50 VU sebelum break. Skenario write-heavy (S2) breaking point biasanya jauh lebih rendah (15-20 VU) karena DB write lebih mahal. Detail per skenario ada di §5.

### 3.2 Pass Threshold (untuk L2 Baseline = production-grade)

| Metrik | Target |
|--------|-------:|
| P95 response time (page) | < 800 ms |
| P95 response time (API JSON) | < 500 ms |
| P99 response time | < 1.500 ms |
| Error rate | < 1% |
| 5xx responses | 0 |
| Memory drift selama soak 30 menit | ≤ ±10 MB RSS |

Threshold per skenario dapat di-relax sesuai karakteristik (misal: checkout boleh P95 < 1.500 ms karena write-heavy).

## 4. Strategi External API

Pendekatan: **selective mock** (Opsi C dari brainstorming).

| Service | Strategi | Alasan |
|---------|----------|--------|
| Telegram Bot API | Mock (delay 50 ms) | Rate limit ~30 msg/sec, bot bisa di-block |
| DhruFusion (IMEI) | Mock (delay 200 ms) | Charge per request, rate limit |
| BinderByte (shipping) | Mock (delay 150 ms) | Kuota harian, rate limit |
| Cloudflare R2 | Hit real | Bandwidth lokal saja, tidak ada per-request cost |
| Google OAuth | Tidak relevan | Butuh real user interaction, tidak di-test |

**Aktivasi**: env flag `STRESS_TEST_MODE=true` di `.env.local`. Helper `src/lib/stress-mode.ts` membaca flag ini. Setiap client library (`telegram.ts`, `dhru-fusion.ts`, `binderbyte-client.ts`) menambahkan early-return berbasis flag.

**Production safety**: ketika flag tidak di-set (default), perilaku 100% identik dengan sekarang. Zero risk untuk production.

## 5. Skenario Detail

### 5.1 S1 — Public Discovery

**Tujuan**: Validasi halaman publik (visitor pertama). Read-heavy, cache-friendly.

**Endpoint**:
- `GET /` (landing)
- `GET /marketplace`, `GET /api/marketplace/products?page=...&category=...`
- `GET /teknisi`, `GET /api/teknisi?page=...`
- `GET /toko`, `GET /api/stores?page=...`
- `GET /teknisi/[id]` (public profile)
- `GET /api/search?q=...`
- `GET /api/banners`

**User behavior**: 1 VU = 1 visitor yang browse landing → marketplace 2-3 page → product detail → search 1x. Think time 2-5 detik antar request.

**Stages** (k6):
```
30s ramp 0→10 → 2min steady 10
30s ramp 10→30 → 2min steady 30
30s ramp 30→50 → 2min steady 50  (breaking point)
30s ramp 50→0
Total ~7 menit
```

**Hipotesis yang divalidasi**:
- HTTP cache header berfungsi
- Image optimization tidak block render
- Listing query tidak N+1
- Pagination cepat di limit besar

### 5.2 S2 — Marketplace Transaction E2E

**Tujuan**: Test full transaction journey, paling kritis untuk revenue.

**Per VU iteration**:
1. Login (POST credentials → simpan session cookie)
2. `GET /api/marketplace/products?...` — pilih random produk
3. `GET /api/marketplace/products/[id]` — detail
4. `POST /api/marketplace/checkout` — create order, debit wallet
5. `GET /api/user/marketplace/orders` — verify order created
6. Logout

**Pre-test setup**:
- 30 user test dengan email `stress-user-{1..30}@indoteknizi.test`, password sama, wallet balance Rp 5.000.000
- 50 produk dummy, stock = 1.000 (tidak akan habis selama test)
- BinderByte shipping API di-mock

**Stages**:
```
1min ramp 0→5 → 3min steady 5
1min ramp 5→15 → 2min steady 15
30s ramp 15→0
Total ~8 menit
```

**Hipotesis yang divalidasi**:
- Wallet ledger transaction atomic (tidak race condition)
- Order creation atomic (tidak partial write)
- Stock decrement konsisten saat concurrent buyer

**Risiko yang dipantau**:
- Wallet ledger jadi negatif
- Orphan order (order created tapi wallet tidak debit, atau sebaliknya)
- Race condition concurrent buy

### 5.3 S3 — Service Request

**Tujuan**: Test request layanan + integrasi notifikasi (Telegram, activity log).

**Per VU iteration**, distribusi:
- 50% `POST /api/remote`
- 30% `POST /api/user/konsultasi`
- 20% `POST /api/user/inspeksi`

**Pre-test setup**:
- 20 teknisi test, 5 di antaranya sudah link Telegram (chatId dummy: `999000001..999000005`)
- 30 user test (sama dengan S2)
- Telegram API di-mock (delay 50 ms artificial)

**Stages**:
```
30s ramp 0→5 → 2min steady 5
30s ramp 5→15 → 2min steady 15
30s ramp 15→0
Total ~6 menit
```

**Hipotesis yang divalidasi**:
- Notifikasi Telegram non-blocking (response time < 500 ms walau Telegram delay 50 ms)
- Activity logging tidak block API response
- Database write per request < 200 ms

### 5.4 S4 — Real-time Polling & Chat

**Tujuan**: Test endpoint yang di-poll terus oleh client.

**Endpoint**:
- `GET /api/notifications` (di-poll setiap ~30 detik per user di production)
- `GET /api/teknisi/presence`
- `GET /api/chat/conversations`
- `POST /api/chat/conversations/[id]/messages`
- `GET /api/teknisi/remote` (teknisi check pending request)

**User behavior**: 1 VU = 1 teknisi login + polling. Tiap iteration call 3-4 endpoint dengan think time 5-10 detik (mirip real polling interval).

**Stages**:
```
30s ramp 0→10 → 5min steady 10
30s ramp 10→30 → 3min steady 30
30s ramp 30→0
Total ~10 menit
```

**Hipotesis yang divalidasi**:
- DB tidak overwhelmed dengan polling
- Tidak ada N+1 di chat list query
- Presence update tidak lock heavily
- Connection pool tidak exhausted

**Risiko yang dipantau**: Prisma connection pool default `physical_cpus * 2 + 1`. Di VPS 1 vCPU = 3 connection. Kalau 30 user polling bersamaan, sangat mungkin saturasi. Test ini akan validate atau bantah.

### 5.5 S5 — Soak Test

**Tujuan**: Detect memory leak, terutama dari background jobs (`instrumentation.ts`).

**Pattern**:
- Constant 5 VU mixing semua flow (S1+S2+S3+S4 dengan distribusi proporsional) selama 30 menit
- Background jobs (IMEI polling, shipping sync, order tracking) jalan normal
- Telegram & external API tetap di-mock

**Yang dipantau**:
- RSS memory Node.js (via custom endpoint `GET /api/_internal/memory` yang aktif hanya saat `STRESS_TEST_MODE=true`)
- PostgreSQL memory & connection count (via query `pg_stat_activity`)
- Latency drift dari menit ke menit (apakah lambat secara progresif?)

**Threshold**:
- RSS naik ≤ ±10 MB → PASS
- RSS naik 10-50 MB → INVESTIGATE
- RSS naik > 50 MB → FAIL (memory leak confirmed)

## 6. Struktur File & Implementation

### 6.1 Folder Layout

```
indoteknizi/
└── stress-test/
    ├── README.md                          # cara pakai (Indonesian)
    ├── plan.md                            # ringkasan skenario (rujuk ke spec ini)
    ├── config/
    │   └── thresholds.js                  # shared thresholds antar skenario
    ├── lib/
    │   ├── auth.js                        # helper login k6
    │   ├── data.js                        # helper pick random user/product
    │   └── metrics.js                     # custom metrics
    ├── scenarios/
    │   ├── 01-public-discovery.js
    │   ├── 02-marketplace-checkout.js
    │   ├── 03-service-request.js
    │   ├── 04-realtime-polling.js
    │   └── 05-soak-test.js
    ├── seed/
    │   └── stress-seed.ts                 # tambahan seed untuk test
    ├── monitor.sh                         # helper monitor resource saat test
    └── results/                           # gitignored
        ├── REPORT_TEMPLATE.md
        └── .gitkeep

indoteknizi/src/lib/
├── stress-mode.ts                         # cek STRESS_TEST_MODE flag
└── (modifikasi minimal di telegram.ts, dhru-fusion.ts, binderbyte-client.ts)
```

### 6.2 NPM Scripts Tambahan

```json
{
  "scripts": {
    "stress:seed": "tsx stress-test/seed/stress-seed.ts",
    "stress:clean": "tsx stress-test/seed/clean.ts",
    "stress:smoke": "k6 run stress-test/scenarios/01-public-discovery.js --vus 1 --duration 30s",
    "stress:1": "k6 run stress-test/scenarios/01-public-discovery.js",
    "stress:2": "k6 run stress-test/scenarios/02-marketplace-checkout.js",
    "stress:3": "k6 run stress-test/scenarios/03-service-request.js",
    "stress:4": "k6 run stress-test/scenarios/04-realtime-polling.js",
    "stress:soak": "k6 run stress-test/scenarios/05-soak-test.js",
    "stress:all": "npm run stress:1 && npm run stress:2 && npm run stress:3 && npm run stress:4"
  }
}
```

### 6.3 Mock Pattern (Contoh)

```typescript
// src/lib/stress-mode.ts
export function isStressTestMode(): boolean {
  return process.env.STRESS_TEST_MODE === 'true'
}

// src/lib/telegram.ts (modifikasi minimal di awal sendTelegramMessage)
export async function sendTelegramMessage(chatId, text, options) {
  if (isStressTestMode()) {
    await new Promise(r => setTimeout(r, 50))
    return { success: true }
  }
  // ...existing real implementation tidak diubah
}
```

Pola sama untuk `dhru-fusion.ts` (delay 200 ms, return mock IMEI response) dan `binderbyte-client.ts` (delay 150 ms, return mock tracking).

### 6.4 Custom Metrics (k6)

Per skenario akan track:
- `successful_logins` (counter)
- `successful_checkouts` (counter, hanya S2)
- `notifications_dispatched` (counter, hanya S3)
- `transaction_time` (trend, hanya S2: durasi full E2E checkout)
- `iteration_failures` (rate)

### 6.5 Custom Internal Endpoints (Stress-Mode Only)

Aktif hanya saat `STRESS_TEST_MODE=true`:
- `GET /api/_internal/memory` → return `process.memoryUsage()`
- `GET /api/_internal/db-stats` → return active connection count
- `POST /api/_internal/reset-test-data` → cleanup test users/orders

Akses dilindungi oleh check env flag, return 404 jika flag tidak set.

## 7. Eksekusi & Monitoring

### 7.1 Pra-eksekusi Checklist

Setiap script otomatis verifikasi:
1. `STRESS_TEST_MODE=true` di env (kalau tidak set → exit error)
2. `NEXT_PUBLIC_APP_URL` mengarah ke localhost (cegah hit production)
3. Test user pertama (`stress-user-1@indoteknizi.test`) ada di DB (cegah test tanpa seed)

### 7.2 Tiga Terminal Monitoring

| Terminal | Tugas | Command |
|----------|-------|---------|
| 1 | k6 runner | `npm run stress:1` |
| 2 | Resource sistem | `htop` (filter "next") |
| 3 | PostgreSQL | `bash stress-test/monitor.sh` |

`monitor.sh` loop tiap 5 detik tampilkan: connection count per state, top 5 active queries, slow query top 5.

### 7.3 Decision Matrix Per Skenario

| Skenario | PASS | INVESTIGATE | FAIL |
|----------|------|-------------|------|
| S1 | P95 < 800ms, errors < 1% | P95 800-1500ms | P95 > 1500ms atau errors > 5% |
| S2 | Zero failed checkout, P95 < 1.5s | Latency 1.5-3s | Wallet inconsistency atau orphan order |
| S3 | Notif terkirim semua, P95 < 1s | Notif delay > 5s | Activity log block response |
| S4 | DB conn < 8/10, P95 < 500ms | Saturation 8-10/10 | Pool exhausted |
| S5 | RSS stabil ±10MB | Naik 10-50MB/30min | Naik >50MB |

## 8. Bottleneck Detection Playbook

### 8.1 Symptom A: P95 Latency Tinggi di S1 (Discovery)

**Diagnostic**:
1. Cek slow query log → identifikasi query untuk listing
2. `EXPLAIN ANALYZE` query → cari Seq Scan / sort tanpa index
3. Verify pagination — offset besar = slow

**Likely fixes**: tambah index di kolom yang sering di-filter, ganti offset pagination → cursor pagination, tambah HTTP cache header.

### 8.2 Symptom B: Wallet Inconsistency di S2 (Checkout)

**Diagnostic**:
1. Cek apakah operasi wallet pakai `prisma.$transaction()`
2. Cek isolation level
3. Identifikasi pola SELECT-then-UPDATE yang race-able

**Likely fixes**: pakai atomic `UPDATE ... WHERE balance >= amount RETURNING ...`, wrap dengan `$transaction({ isolationLevel: 'Serializable' })`.

### 8.3 Symptom C: Connection Pool Exhausted di S4 (Polling)

**Diagnostic**:
1. Cek default Prisma pool size (formula: `cpu * 2 + 1`)
2. Hitung concurrent DB query saat peak

**Likely fixes**: tambah `?connection_limit=20` di DATABASE_URL, implementasi response cache untuk endpoint polling, tambah HTTP cache header `Cache-Control: max-age=10`.

### 8.4 Symptom D: Memory Leak di S5 (Soak)

**Diagnostic**:
1. Cek `instrumentation.ts` → apakah event listener di-cleanup?
2. Cek in-memory store yang grow unbounded
3. Profile dengan `node --inspect` + Chrome DevTools

**Likely fixes**: tambah cleanup di scheduler, cap ukuran in-memory store, gunakan WeakMap kalau perlu.

## 9. Report Template

Disimpan di `stress-test/results/REPORT_TEMPLATE.md`. Diisi manual setelah test selesai. Struktur:

1. Executive Summary (verdict overall: READY / NEEDS FIX / NOT READY)
2. Per Scenario Results (P95, error rate, throughput, verdict)
3. Bottleneck Findings (severity, root cause, fix, effort)
4. Capacity Planning Conclusion (estimasi max VU di VPS, rekomendasi scale)
5. Production Readiness Checklist

## 10. Cleanup & Safety

### 10.1 Setelah Setiap Test

- `pg_stat_statements` di-reset (untuk clean baseline test berikutnya)
- Background jobs di-pause sementara (opsional, hanya jika mengganggu)

### 10.2 Setelah Semua Test Selesai

`npm run stress:clean` akan:
- Delete user dengan email `*@indoteknizi.test`
- Cascade delete order/session/wallet entry mereka
- Tidak menghapus produk dummy (bisa dipakai untuk test berikutnya)

### 10.3 Production Deployment Safety

- `STRESS_TEST_MODE` HARUS tidak di-set di production env
- Internal endpoints (`/api/_internal/*`) return 404 jika flag tidak set
- Verifikasi via curl setelah deploy: `curl https://indoteknizi.com/api/_internal/memory` → harus 404

## 11. Deliverables

Output dari implementasi spec ini:

1. **Documentation**: `stress-test/README.md`, `stress-test/plan.md`
2. **k6 scripts** (5 skenario)
3. **Helper library** (auth, data, metrics, thresholds)
4. **Seed scripts** (`stress-seed.ts`, `clean.ts`)
5. **Monitor scripts** (`monitor.sh`)
6. **Mock layer** (modifikasi minimal di 3 client library + `stress-mode.ts`)
7. **Internal endpoints** (memory, db-stats, reset-test-data)
8. **NPM scripts** (9 baru di `package.json`: `stress:seed`, `stress:clean`, `stress:smoke`, `stress:1`-`stress:4`, `stress:soak`, `stress:all`)
9. **Report template** (`stress-test/results/REPORT_TEMPLATE.md`)

## 12. Open Questions / Future Work

- Apakah perlu integrasikan k6 dengan Grafana dashboard untuk visualisasi real-time? (skip untuk MVP, bisa nyusul)
- Threshold final perlu di-validate setelah baseline run pertama (dokumen ini pakai estimasi konservatif)
- Setelah deploy ke VPS, ulangi semua skenario di staging untuk validate threshold dengan resource asli
- Pertimbangan tambah skenario untuk `/api/wallet/topup` flow setelah payment gateway diintegrasikan

---

**Next step setelah spec approved**: Invoke `writing-plans` skill untuk break down jadi implementation tasks.
