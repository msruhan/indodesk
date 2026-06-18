# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 13:29:11 UTC
**Base URL**: http://localhost:3000
**Mode**: batch11-teknisi-store-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 12 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ⚠️ PASS WITH SKIPS
- **Total dieksekusi**: 12
- **Pass**: 9 (75%)
- **Fail**: 0
- **Skip**: 3 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 8.34s
- **Avg per case**: 695ms

## 2. Per-Domain Results

### ⚠️ STR (pass 9 / fail 0 / skip 3 / total 12)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-STR-001 | TEKNISI aktivasi store baru | ✅ PASS | 1186ms | — |
| FT-STR-002 | Edit profile picture & cover image | ⏭️ SKIP | 4ms | Upload cover/avatar memerlukan multipart file |
| FT-STR-003 | Tambah portfolio case | ✅ PASS | 1087ms | — |
| FT-STR-004 | Update gallery toko | ⏭️ SKIP | 2ms | Gallery update memerlukan multipart upload |
| FT-STR-005 | Update journey timeline | ✅ PASS | 432ms | — |
| FT-STR-006 | Update operating hours | ✅ PASS | 360ms | — |
| FT-STR-007 | Submit listing produk untuk approval ADMIN | ✅ PASS | 632ms | — |
| FT-STR-101 | Aktivasi store dengan field wajib kosong ditolak [NEGATIVE] | ✅ PASS | 648ms | — |
| FT-STR-102 | Submit produk dengan harga ≤ 0 ditolak [NEGATIVE] | ✅ PASS | 450ms | — |
| FT-STR-103 | Upload gambar > 5 MB untuk cover ditolak [NEGATIVE] | ⏭️ SKIP | 16ms | Upload cover > 5MB memerlukan multipart file |
| FT-STR-201 | Edit produk yang sedang PENDING approval [EDGE] | ✅ PASS | 2984ms | — |
| FT-STR-901 | USER mengakses /api/teknisi/store/* ditolak [RBAC] | ✅ PASS | 537ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

- **Upload cover/avatar memerlukan multipart file**: FT-STR-002
- **Gallery update memerlukan multipart upload**: FT-STR-004
- **Upload cover > 5MB memerlukan multipart file**: FT-STR-103
