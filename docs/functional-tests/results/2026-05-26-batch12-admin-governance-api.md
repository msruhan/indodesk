# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 13:29:21 UTC
**Base URL**: http://localhost:3000
**Mode**: batch12-admin-governance-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 14 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ⚠️ PASS WITH SKIPS
- **Total dieksekusi**: 14
- **Pass**: 13 (93%)
- **Fail**: 0
- **Skip**: 1 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 7.73s
- **Avg per case**: 552ms

## 2. Per-Domain Results

### ⚠️ ADM (pass 13 / fail 0 / skip 1 / total 14)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-ADM-001 | Approve product listing PENDING | ✅ PASS | 872ms | — |
| FT-ADM-002 | Reject product listing dengan alasan | ✅ PASS | 1394ms | — |
| FT-ADM-003 | Approve teknisi store baru | ✅ PASS | 374ms | — |
| FT-ADM-004 | Kelola HelpArticle | ✅ PASS | 466ms | — |
| FT-ADM-005 | Kelola PlatformSetting (feature flag) | ✅ PASS | 474ms | — |
| FT-ADM-006 | Monitoring sesi (konsultasi & remote) | ✅ PASS | 495ms | — |
| FT-ADM-007 | Baca ActivityLog audit trail | ✅ PASS | 424ms | — |
| FT-ADM-101 | Approve produk yang sudah APPROVED ditolak [NEGATIVE] | ✅ PASS | 341ms | — |
| FT-ADM-102 | Reject produk tanpa alasan ditolak [NEGATIVE] | ⏭️ SKIP | 403ms | Tidak ada teknisi PENDING di antrian |
| FT-ADM-103 | Manual deposit dengan nominal ≤ 0 ditolak [NEGATIVE] | ✅ PASS | 367ms | — |
| FT-ADM-201 | Reject store yang sudah PUBLISHED [EDGE] | ✅ PASS | 1265ms | — |
| FT-ADM-901 | USER mengakses /admin/* ditolak [RBAC] | ✅ PASS | 452ms | — |
| FT-ADM-902 | TEKNISI mengakses /api/admin/* ditolak [RBAC] | ✅ PASS | 323ms | — |
| FT-ADM-903 | Guest mengakses authenticated page redirect ke login [RBAC] | ✅ PASS | 82ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

- **Tidak ada teknisi PENDING di antrian**: FT-ADM-102
