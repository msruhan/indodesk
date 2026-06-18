# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 06:29:52 UTC
**Base URL**: http://localhost:3000
**Mode**: batch7-imei-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 12 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 12
- **Pass**: 12 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 9.38s
- **Avg per case**: 781ms

## 2. Per-Domain Results

### ✅ IMEI (pass 12 / fail 0 / skip 0 / total 12)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-IMEI-001 | Browse katalog IMEI services | ✅ PASS | 31ms | — |
| FT-IMEI-002 | Submit order IMEI sederhana (hanya IMEI) | ✅ PASS | 896ms | — |
| FT-IMEI-003 | Submit order IMEI dengan field wajib lengkap | ✅ PASS | 374ms | — |
| FT-IMEI-004 | Polling order SUCCESS dengan kode unlock | ✅ PASS | 3754ms | — |
| FT-IMEI-005 | Lihat history & detail order IMEI | ✅ PASS | 414ms | — |
| FT-IMEI-101 | IMEI panjang ≠ 15 digit ditolak [NEGATIVE] | ✅ PASS | 16ms | — |
| FT-IMEI-102 | IMEI berisi karakter non-numerik ditolak [NEGATIVE] | ✅ PASS | 350ms | — |
| FT-IMEI-103 | Service ID tidak ada ditolak [NEGATIVE] | ✅ PASS | 334ms | — |
| FT-IMEI-104 | Field model/network kosong padahal requiresModel=true ditolak [NEGATIVE] | ✅ PASS | 328ms | — |
| FT-IMEI-201 | Provider DhruFusion timeout → order FAILED + auto refund [EDGE] | ✅ PASS | 1105ms | — |
| FT-IMEI-202 | Provider return "credit habis" → order FAILED + auto refund [EDGE] | ✅ PASS | 1103ms | — |
| FT-IMEI-901 | USER lain mengakses ImeiOrder bukan miliknya ditolak [RBAC] | ✅ PASS | 670ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
