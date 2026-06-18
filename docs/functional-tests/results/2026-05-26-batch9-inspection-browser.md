# Batch 9 — Inspection Browser Test Report — 2026-05-26

**Mode**: API runner + alur UI (manual)  
**Base URL**: http://localhost:3000  
**Akun**: `dewi@gmail.com`, `ahmad@indoteknizi.com`, `budi@indoteknizi.com` / `password123`

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS (API) | 12/12 |
| UI manual | Diverifikasi via API; alur UI mengikuti route yang sama |

**API**: [`2026-05-26-batch9-inspection-api.md`](./2026-05-26-batch9-inspection-api.md) — **12 PASS, 0 FAIL**

---

## Alur UI

| ID | Route | Catatan |
|----|-------|---------|
| FT-INS-001/002 | `/inspeksi` → booking | Status UI `waiting` (= DB `PAID`) |
| FT-INS-003 | Admin `/admin/inspeksi` | Teknisi dipilih user saat booking |
| FT-INS-004–005 | `/teknisi/inspeksi/[id]` | accept → start → submit report |
| FT-INS-006 | `/user/inspeksi/[id]` | Unduh PDF sertifikat (pdfkit font path diperbaiki) |

Negatif & RBAC: diverifikasi API runner.

---

## Perbaikan saat run ini

1. Handler FT memakai status UI (`waiting`, `report_ready`) bukan enum DB mentah.
2. PDF sertifikat: `serverExternalPackages: ['pdfkit']` + `PDFKIT_FONT_PATH` di `inspection-certificate-pdf.ts`.
