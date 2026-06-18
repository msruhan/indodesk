# Functional Full Test Report — 2026-05-26

**Run at**: 2026-05-26 09:01:51 UTC
**Base URL**: http://localhost:3000
**Mode**: batch9-inspection-api
**Auth**: `/api/stress-internal/login` (STRESS_TEST_MODE=true)
**Dokumentasi**: 12 skenario di `docs/functional-tests/`

---

## 1. Executive Summary

- **Verdict**: ✅ ALL PASS
- **Total dieksekusi**: 12
- **Pass**: 12 (100%)
- **Fail**: 0
- **Skip**: 0 (UI-only / belum ada API / butuh interaksi manual)
- **Total duration**: 17.33s
- **Avg per case**: 1444ms

## 2. Per-Domain Results

### ✅ INS (pass 12 / fail 0 / skip 0 / total 12)

| ID | Test Case | Status | Duration | Note |
| --- | --- | :---: | ---: | --- |
| FT-INS-001 | USER request inspeksi ONLINE | ✅ PASS | 1544ms | — |
| FT-INS-002 | USER request inspeksi OFFLINE (kunjungan teknisi) | ✅ PASS | 967ms | — |
| FT-INS-003 | Penugasan teknisi otomatis / manual ADMIN | ✅ PASS | 1193ms | — |
| FT-INS-004 | TEKNISI accept & start inspeksi | ✅ PASS | 1765ms | — |
| FT-INS-005 | TEKNISI submit report dengan generate PDF | ✅ PASS | 3051ms | — |
| FT-INS-006 | USER unduh sertifikat & report PDF | ✅ PASS | 4019ms | — |
| FT-INS-101 | Inspeksi OFFLINE dengan alamat kosong ditolak [NEGATIVE] | ✅ PASS | 731ms | — |
| FT-INS-102 | Jadwal inspeksi di masa lalu ditolak [NEGATIVE] | ✅ PASS | 727ms | — |
| FT-INS-103 | Kategori device tidak didukung ditolak [NEGATIVE] | ✅ PASS | 808ms | — |
| FT-INS-104 | Submit report tanpa upload foto ditolak [NEGATIVE] | ✅ PASS | 1133ms | — |
| FT-INS-201 | Tidak ada teknisi tersedia → kembali ke PENDING_ASSIGNMENT [EDGE] | ✅ PASS | 350ms | — |
| FT-INS-901 | TEKNISI akses InspectionOrder yang tidak ditugaskan ditolak [RBAC] | ✅ PASS | 1041ms | — |

## 3. Failed Tests

Tidak ada kegagalan.
## 4. Skipped Tests (ringkasan alasan)

Tidak ada skip.
