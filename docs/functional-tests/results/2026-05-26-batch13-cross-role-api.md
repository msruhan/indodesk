# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 14:03:41 UTC
**Base URL**: http://localhost:3000
**Mode**: batch13-cross-role-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 17 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 17
- **Pass**: 17 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 16.20s
- **Avg per case**: 953ms

## 2. Per-Domain Results

### ✅ CROSS (pass 17 / fail 0 / skip 0 / total 17)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-CROSS-001 | Marketplace E2E (USER ↔ TEKNISI ↔ ADMIN) | ✅ PASS | 3220ms | — |
| FT-CROSS-002 | Rekber dengan Dispute (USER ↔ TEKNISI ↔ USER ↔ ADMIN) | ✅ PASS | 2433ms | — |
| FT-CROSS-003 | Inspection E2E (USER ↔ ADMIN ↔ TEKNISI ↔ USER) | ✅ PASS | 2290ms | — |
| FT-CROSS-004 | Konsultasi E2E (USER ↔ TEKNISI ↔ USER ↔ TEKNISI) | ✅ PASS | 2055ms | — |
| FT-CROSS-005 | Listing Approval E2E (TEKNISI ↔ ADMIN ↔ USER) | ✅ PASS | 1817ms | — |
| FT-CROSS-901 | USER siti tidak boleh GET /api/admin/users [RBAC] | ✅ PASS | 333ms | — |
| FT-CROSS-902 | USER siti tidak boleh buka /admin/dashboard [RBAC] | ✅ PASS | 321ms | — |
| FT-CROSS-903 | TEKNISI ahmad tidak boleh approve produk via admin API [RBAC] | ✅ PASS | 330ms | — |
| FT-CROSS-904 | TEKNISI ahmad tidak boleh buka /admin/users [RBAC] | ✅ PASS | 363ms | — |
| FT-CROSS-905 | USER siti tidak boleh PATCH toko teknisi [RBAC] | ✅ PASS | 324ms | — |
| FT-CROSS-906 | USER rudi tidak boleh ship order sebagai teknisi [RBAC] | ✅ PASS | 663ms | — |
| FT-CROSS-907 | Guest tidak boleh buka /user/orders [RBAC] | ✅ PASS | 4ms | — |
| FT-CROSS-908 | Guest tidak boleh buka /teknisi/dashboard [RBAC] | ✅ PASS | 3ms | — |
| FT-CROSS-909 | Guest tidak boleh buka area /admin/* [RBAC] | ✅ PASS | 3ms | — |
| FT-CROSS-910 | TEKNISI budi tidak boleh ubah order marketplace milik ahmad [RBAC] | ✅ PASS | 686ms | — |
| FT-CROSS-911 | USER rudi tidak boleh akses tracking order milik siti [RBAC] | ✅ PASS | 678ms | — |
| FT-CROSS-912 | TEKNISI ahmad tidak boleh manual deposit admin [RBAC] | ✅ PASS | 675ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
