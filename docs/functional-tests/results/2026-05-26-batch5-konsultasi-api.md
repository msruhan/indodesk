# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 06:02:21 UTC
**Base URL**: http://localhost:3000
**Mode**: batch5-konsultasi-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 10 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 10
- **Pass**: 10 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 10.31s
- **Avg per case**: 1031ms

## 2. Per-Domain Results

### ✅ KON (pass 10 / fail 0 / skip 0 / total 10)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-KON-001 | USER booking konsultasi | ✅ PASS | 708ms | — |
| FT-KON-002 | Pembayaran konsultasi via wallet | ✅ PASS | 846ms | — |
| FT-KON-003 | TEKNISI accept dan sesi ACTIVE | ✅ PASS | 1239ms | — |
| FT-KON-004 | TEKNISI mark as COMPLETED | ✅ PASS | 1062ms | — |
| FT-KON-005 | USER beri review setelah COMPLETED | ✅ PASS | 1133ms | — |
| FT-KON-101 | Booking tanpa autentikasi ditolak [NEGATIVE] | ✅ PASS | 403ms | — |
| FT-KON-102 | Booking dengan teknisiId tidak ada ditolak [NEGATIVE] | ✅ PASS | 390ms | — |
| FT-KON-103 | Booking saat saldo wallet kurang ditolak [NEGATIVE] | ✅ PASS | 1990ms | — |
| FT-KON-201 | Pembatalan setelah TEKNISI accept → refund utuh [EDGE] | ✅ PASS | 1051ms | — |
| FT-KON-901 | TEKNISI accept sesi yang ditugaskan ke teknisi lain ditolak [RBAC] | ✅ PASS | 1488ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
