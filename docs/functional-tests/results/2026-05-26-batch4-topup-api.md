# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 05:53:14 UTC
**Base URL**: http://localhost:3000
**Mode**: batch4-topup-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 10 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 10
- **Pass**: 10 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 14.86s
- **Avg per case**: 1486ms

## 2. Per-Domain Results

### ✅ TOP (pass 10 / fail 0 / skip 0 / total 10)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-TOP-001 | Browse katalog topup | ✅ PASS | 105ms | — |
| FT-TOP-002 | Pilih denominasi & isi nomor tujuan | ✅ PASS | 338ms | — |
| FT-TOP-003 | Checkout topup via wallet | ✅ PASS | 386ms | — |
| FT-TOP-004 | Order SUCCESS dengan kode produk tampil | ✅ PASS | 8565ms | — |
| FT-TOP-101 | Checkout topup tanpa autentikasi ditolak [NEGATIVE] | ✅ PASS | 11ms | — |
| FT-TOP-102 | Checkout dengan denominationId tidak ada ditolak [NEGATIVE] | ✅ PASS | 334ms | — |
| FT-TOP-103 | Nomor tujuan format invalid ditolak [NEGATIVE] | ✅ PASS | 393ms | — |
| FT-TOP-104 | Saldo wallet kurang untuk topup ditolak [NEGATIVE] | ✅ PASS | 943ms | — |
| FT-TOP-201 | Provider topup return error → order FAILED + auto refund [EDGE] | ✅ PASS | 3458ms | — |
| FT-TOP-901 | ADMIN tidak boleh checkout topup atas nama USER [RBAC] | ✅ PASS | 322ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
