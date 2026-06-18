# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 06:13:00 UTC
**Base URL**: http://localhost:3000
**Mode**: batch6-remote-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 9 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 9
- **Pass**: 9 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 6.51s
- **Avg per case**: 723ms

## 2. Per-Domain Results

### ✅ REM (pass 9 / fail 0 / skip 0 / total 9)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-REM-001 | USER request remote session | ✅ PASS | 789ms | — |
| FT-REM-002 | Download IndoDesk client | ✅ PASS | 11ms | — |
| FT-REM-003 | TEKNISI accept dan sesi IN_PROGRESS | ✅ PASS | 1042ms | — |
| FT-REM-004 | TEKNISI mark COMPLETED | ✅ PASS | 1049ms | — |
| FT-REM-101 | Request remote tanpa autentikasi ditolak [NEGATIVE] | ✅ PASS | 327ms | — |
| FT-REM-102 | Remote ID format invalid ditolak [NEGATIVE] | ✅ PASS | 661ms | — |
| FT-REM-103 | Description kosong ditolak [NEGATIVE] | ✅ PASS | 636ms | — |
| FT-REM-201 | TEKNISI reject remote request [EDGE] | ✅ PASS | 988ms | — |
| FT-REM-901 | USER lain mengakses RemoteSession bukan miliknya ditolak [RBAC] | ✅ PASS | 1004ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
