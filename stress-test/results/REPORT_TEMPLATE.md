# Stress Test Report — IndoTeknizi MVP

**Date**: YYYY-MM-DD
**Tested by**: <nama>
**Environment**: Local (Mac/Linux, X GB RAM, dev server)
**Target VPS**: 1 vCPU, 2 GB RAM

---

## 1. Executive Summary

- **Overall verdict**: ✅ READY / ⚠️ NEEDS FIX / ❌ NOT READY
- **Top 3 findings**:
  1.
  2.
  3.
- **Recommendation before launch**:

---

## 2. Per Scenario Results

### S1 — Public Discovery
- Verdict: PASS / INVESTIGATE / FAIL
- Total requests: ___
- P95: ___ ms | P99: ___ ms
- Error rate: ___ %
- Throughput: ___ req/s
- Notes:

### S2 — Marketplace Checkout
- Verdict: PASS / INVESTIGATE / FAIL
- Successful checkouts: ___
- P95: ___ ms | P99: ___ ms
- Error rate: ___ %
- Wallet/order inconsistency found: yes/no
- Notes:

### S3 — Service Request
- Verdict: PASS / INVESTIGATE / FAIL
- Requests by type: remote=___, konsultasi=___, inspeksi=___
- P95: ___ ms | P99: ___ ms
- Notif dispatch verified: yes/no
- Notes:

### S4 — Realtime Polling
- Verdict: PASS / INVESTIGATE / FAIL
- Peak DB connections: ___
- P95: ___ ms | P99: ___ ms
- Pool saturation detected: yes/no
- Notes:

### S5 — Soak Test
- Verdict: PASS / INVESTIGATE / FAIL
- RSS min/max/drift: ___ / ___ / ___ MB
- Latency drift: ___ ms (start) → ___ ms (end)
- Memory leak suspected: yes/no
- Notes:

---

## 3. Bottleneck Findings

| # | Severity | Title | Root Cause | Fix | Effort |
|---|----------|-------|------------|-----|--------|
| 1 | High/Med/Low | | | | S/M/L |
| 2 | | | | | |

---

## 4. Capacity Planning Conclusion

- **Headroom from 30 → 50 VU**: ___ %
- **Estimated max concurrent users di VPS 1vCPU/2GB**: ~___
- **Rekomendasi**:
  - [ ] Co-located OK untuk MVP
  - [ ] Pisahkan DB sebelum launch
  - [ ] Optimasi dulu sebelum scale up

---

## 5. Production Readiness Checklist

- [ ] Semua threshold L2 (10 VU baseline) PASS
- [ ] Soak test 30 menit no memory leak
- [ ] Slow query teratasi (P95 query < 100ms)
- [ ] Connection pool config sesuai VPS
- [ ] External API mock dimatikan saat deploy (verify `STRESS_TEST_MODE` tidak ada di production env)
- [ ] Internal endpoints `/api/_internal/*` return 404 di production (verifikasi via curl post-deploy)
- [ ] Monitoring (logs, error tracking) terpasang
- [ ] Database backup strategy ready
- [ ] Rollback plan documented
