# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 06:38:56 UTC
**Base URL**: http://localhost:3000
**Mode**: batch8-server-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 10 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 10
- **Pass**: 10 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 14.79s
- **Avg per case**: 1479ms

## 2. Per-Domain Results

### ✅ SRV (pass 10 / fail 0 / skip 0 / total 10)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-SRV-001 | Browse katalog Server Services | ✅ PASS | 18ms | — |
| FT-SRV-002 | Submit Server Order | ✅ PASS | 564ms | — |
| FT-SRV-003 | Polling Server Order ke SUCCESS | ✅ PASS | 3803ms | — |
| FT-SRV-004 | Lihat detail Server Order | ✅ PASS | 488ms | — |
| FT-SRV-005 | Failed order dengan auto-refund | ✅ PASS | 4735ms | — |
| FT-SRV-101 | Service ID tidak ada ditolak [NEGATIVE] | ✅ PASS | 780ms | — |
| FT-SRV-102 | Field wajib kosong ditolak [NEGATIVE] | ✅ PASS | 659ms | — |
| FT-SRV-103 | Status service INACTIVE ditolak [NEGATIVE] | ✅ PASS | 1305ms | — |
| FT-SRV-201 | Provider Server return timeout → order FAILED + refund [EDGE] | ✅ PASS | 1602ms | — |
| FT-SRV-901 | USER lain akses ServerOrder bukan miliknya ditolak [RBAC] | ✅ PASS | 836ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
