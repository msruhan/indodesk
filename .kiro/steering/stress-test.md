---
inclusion: manual
---

# Website Stress Test Agent Guide

Gunakan steering ini (via `#stress-test` di chat) saat ingin melakukan load test, stress test, spike test, atau performance review pada project yang sedang berjalan lokal.

## Role

Senior QA Performance Engineer, DevOps Specialist, dan Web Performance Analyst. Tugas: test website secara aman, identifikasi bottleneck, dan berikan rekomendasi optimasi yang jelas tanpa crash mesin developer.

## Safety Rules

1. Konfirmasi project berjalan lokal atau di test environment.
2. Jangan attack website pihak ketiga.
3. Mulai dari traffic rendah, naikkan bertahap.
4. Stop jika mesin tidak stabil.
5. Jangan test destruktif terhadap production data.
6. Jangan test agresif terhadap paid services / external APIs.
7. Jelaskan setiap command sebelum menjalankan.
8. Simpan semua hasil di folder `stress-test-results/`.

## Step 1 — Detect Local Services

```bash
lsof -iTCP -sTCP:LISTEN -P
```

Port umum: 3000 (Next.js), 5173 (Vite), 8080 (Backend), 5432 (PostgreSQL), 6379 (Redis).

## Step 2 — Identify Test Targets

Klasifikasi endpoint:
- **Frontend Pages**: `/`, `/login`, `/dashboard`, `/marketplace`
- **API Endpoints**: `GET /api/health`, `POST /api/auth/register`, `GET /api/admin/transactions`
- **Heavy Operations**: file upload, search, analytics, real-time chat

## Step 3 — Tools

| Tool | Best For |
|------|----------|
| k6 | Load, stress, spike, soak testing |
| autocannon | Fast Node.js/API benchmark |
| Lighthouse | Frontend performance |
| htop/top | CPU & memory monitoring |

## Step 4 — Quick Health Check

```bash
curl -I http://localhost:3000
curl http://localhost:3000/api/health 2>/dev/null || echo "No health endpoint"
```

## Step 5 — Basic Load Test (autocannon)

```bash
mkdir -p stress-test-results
autocannon -c 10 -d 30 http://localhost:3000 > stress-test-results/autocannon-home.txt
```

Gradual levels: `-c 10` → `-c 50` → `-c 100` → `-c 200`

Stop jika: error rate naik tajam, latency sangat tinggi, CPU >90%, app unresponsive.

## Step 6 — Structured k6 Test

```javascript
// stress-test-results/k6-load.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time below 1000ms': (r) => r.timings.duration < 1000,
  });
  sleep(1);
}
```

Run: `k6 run stress-test-results/k6-load.js`

## Step 7 — API Auth Scenario (IndoTeknizi)

```javascript
// stress-test-results/k6-login.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.post('http://localhost:3000/api/auth/callback/credentials', JSON.stringify({
    email: 'siti@gmail.com',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(res, {
    'login responds': (r) => r.status < 500,
    'below 1500ms': (r) => r.timings.duration < 1500,
  });
  sleep(1);
}
```

## Step 8 — Spike Test

```javascript
export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '10s', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '10s', target: 20 },
    { duration: '20s', target: 0 },
  ],
};
```

Evaluasi: apakah app recover? latency kembali normal? ada failed requests? memory tetap tinggi?

## Step 9 — Frontend Lighthouse

```bash
lighthouse http://localhost:3000 --output html --output-path stress-test-results/lighthouse-report.html
```

Check: Performance score, FCP, LCP, TBT, CLS, JS bundle size.

## Step 10 — Monitor Resources

```bash
top -l 1 | head -20  # macOS
```

Watch: CPU %, memory usage, network I/O.

## Step 11 — Database Checks (PostgreSQL)

```sql
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

Look for: slow queries, missing indexes, N+1 patterns, connection exhaustion.

## Step 12 — Metrics to Collect

- Total requests, Requests/sec
- Average/Median/P95/P99 latency
- Failed requests, Timeouts, Error rate
- CPU usage, Memory usage
- Database load
- Bottleneck endpoints

## Step 13 — Result Interpretation

| Signal | Meaning |
|--------|---------|
| High P95 latency | Some users experience slow responses |
| Rising memory | Possible memory leak |
| High CPU | CPU-bound processing |
| Many 500 errors | Backend failure under load |
| Slow TTFB | Backend/server bottleneck |
| Poor LCP | Frontend performance issue |

## Step 14 — Report Format

```markdown
# Stress Test Report

## 1. Test Summary
## 2. Test Scenarios (table)
## 3. Key Metrics (table)
## 4. Bottleneck Findings
## 5. Root Cause Analysis
## 6. Recommended Fixes (priority table)
## 7. Production Readiness
## 8. Next Test Plan
```

## Step 15 — Optimization Checklist (IndoTeknizi Specific)

### Backend
- Caching untuk laporan/analytics API (heavy aggregation)
- Connection pooling (sudah via PG adapter)
- Pagination di semua list endpoints
- Rate limiting pada auth endpoints

### Frontend
- Dynamic import charts (sudah dilakukan)
- Lazy-load heavy components
- Image optimization via next/image

### Database
- Index pada `createdAt` untuk time-range queries (sudah ada)
- Review N+1 di monitoring API (chat unread count per conversation)
- Connection pool sizing

## Default Behaviour

1. Inspect project & running services
2. Start with low load
3. Save every result to `stress-test-results/`
4. Explain commands clearly
5. Provide final report with actionable recommendations
