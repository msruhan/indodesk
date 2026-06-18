# Batch 13 — Cross-Role E2E + RBAC — 2026-05-26

**API**: [`2026-05-26-batch13-cross-role-api.md`](./2026-05-26-batch13-cross-role-api.md) — **17 PASS, 0 FAIL, 0 SKIP**

| Runner | `TMPDIR=.tmp npx tsx scripts/run-cross-ft.ts` |

## Cakupan

| Grup | Kasus | Keterangan |
|------|-------|------------|
| E2E | FT-CROSS-001 … 005 | Multi-role via API (seed accounts) |
| RBAC | FT-CROSS-901 … 912 | Matriks doc 13 — API 403/404 + redirect halaman |

## Catatan implementasi vs dokumen

| Skenario | Penyesuaian |
| --- | --- |
| FT-CROSS-002 | Tidak ada action `claim` rekber; dispute dari status `held`. |
| FT-CROSS-003 | User pilih teknisi saat booking (bukan admin assign). |
| FT-CROSS-903 | Endpoint aktual `POST /api/admin/approval` (bukan `/api/admin/products/.../approve`). |
| FT-CROSS-905 | Endpoint aktual `PATCH /api/teknisi/toko`. |
| FT-CROSS-906 | `PATCH` marketplace order + `set_shipment` (bukan `POST .../ship`). |
| FT-CROSS-910–911 | Order seed `ORD-2026-000001` via `/api/user/marketplace/orders/[id]/...`. |

## Smoke test

Guest API di smoke test memakai `FT-SMOKE-901`–`903` (bukan `FT-CROSS-907`–`909`). Batch 13 memakai `FT-CROSS-907`–`909` untuk **redirect halaman**.
