# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 05:42:00 UTC
**Base URL**: http://localhost:3000
**Mode**: batch3-rekber-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 11 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 11
- **Pass**: 11 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 13.44s
- **Avg per case**: 1222ms

## 2. Per-Domain Results

### ✅ RKB (pass 11 / fail 0 / skip 0 / total 11)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-RKB-001 | Pembuatan rekber baru (HELD) | ✅ PASS | 1438ms | — |
| FT-RKB-002 | Release dana ke seller (oleh USER, layanan selesai) | ✅ PASS | 740ms | — |
| FT-RKB-003 | Refund dana ke buyer (cancel by ADMIN atau auto-expiry) | ✅ PASS | 2880ms | — |
| FT-RKB-004 | Dispute oleh USER (eskalasi ke ADMIN) | ✅ PASS | 1548ms | — |
| FT-RKB-101 | Buat rekber tanpa autentikasi ditolak [NEGATIVE] | ✅ PASS | 11ms | — |
| FT-RKB-102 | Buat rekber dengan amount ≤ 0 ditolak [NEGATIVE] | ✅ PASS | 653ms | — |
| FT-RKB-103 | Buat rekber dengan saldo wallet kurang ditolak [NEGATIVE] | ✅ PASS | 1307ms | — |
| FT-RKB-104 | Buat rekber dengan seller email tidak terdaftar ditolak [NEGATIVE] | ✅ PASS | 331ms | — |
| FT-RKB-201 | Release rekber yang sudah REFUNDED ditolak [EDGE] | ✅ PASS | 1619ms | — |
| FT-RKB-202 | Release rekber yang sudah RELEASED (double release) ditolak [EDGE] | ✅ PASS | 1319ms | — |
| FT-RKB-901 | USER release rekber bukan miliknya ditolak [RBAC] | ✅ PASS | 1595ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
