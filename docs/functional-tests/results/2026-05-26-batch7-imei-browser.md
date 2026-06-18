# Batch 7 — IMEI Browser Test Report — 2026-05-26

**Mode**: Cursor browser + API (`scripts/run-imei-ft.ts`)  
**Base URL**: http://localhost:3000  
**Akun**: `ahmad@indoteknizi.com` (katalog/order UI), `siti@gmail.com` (riwayat USER), `rudi@gmail.com` (RBAC via API) / `password123`  
**Prasyarat**: `STRESS_TEST_MODE=true` di server dev

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 12 |
| ⚠️ PARTIAL | 0 |
| ⏭️ BLOCKED | **0** |
| ❌ FAIL | 0 |

**API**: 12/12 PASS — [`2026-05-26-batch7-imei-api.md`](./2026-05-26-batch7-imei-api.md)

---

## Hasil per skenario

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| FT-IMEI-001 | Browse katalog IMEI services | ✅ PASS | Login `ahmad@` → `/imei` → tab **Layanan Perangkat 9**, filter grup, 9 kartu layanan |
| FT-IMEI-002 | Submit order IMEI sederhana | ✅ PASS | Cari *Blacklist* → **Order** → IMEI 15 digit → **Submit Order** → modal **Order Berhasil!** |
| FT-IMEI-003 | Submit order + model/network | ✅ PASS | *S24 Ultra* → IMEI + Network `Telkomsel` + Model `SM-S928B` → **Order Berhasil!** (`IMEI-2026-5TF5EC`) |
| FT-IMEI-004 | Polling SUCCESS + kode unlock | ✅ PASS | Stress mock (suffix IMEI `40`) diverifikasi API; di riwayat siti tampil kode `NCK: 12345678…` pada order SUCCESS |
| FT-IMEI-005 | History & detail order | ✅ PASS | `siti@` → `/user/orders/imei` → seed `IMEI-2026-A1B2C3` + kode unlock terlihat di list |
| FT-IMEI-101 | IMEI ≠ 15 digit | ✅ PASS | API 401 (guest) — UI submit tetap disabled jika IMEI &lt; 15 digit |
| FT-IMEI-102 | IMEI non-numerik | ✅ PASS | API 400 |
| FT-IMEI-103 | Service ID tidak ada | ✅ PASS | API 404 |
| FT-IMEI-104 | Field model/network kosong | ✅ PASS | API 400 *Field … wajib diisi*; UI: tombol submit disabled sampai field wajib terisi |
| FT-IMEI-201 | Provider timeout + refund | ✅ PASS | API: order `REJECTED` + saldo kembali (~1s) |
| FT-IMEI-202 | Credit habis + refund | ✅ PASS | API: `REJECTED` + refund wallet |
| FT-IMEI-901 | RBAC user lain | ✅ PASS | API GET `/api/imei/orders/[id]` oleh `rudi` → **403** |

---

## Perubahan kode (batch 7)

1. **`src/lib/imei-stress-mock.ts`** — mock Dhru per suffix IMEI (`…40` success, `…41` reject poll, `…42` credit, `…43` timeout) + `buildStressImei()`.
2. **`src/lib/imei-order-stress-fulfillment.ts`** — auto-advance SUCCESS/REJECT saat GET detail order.
3. **`src/lib/imei-order-worker.ts`** — stress credit/timeout refund saat `toolId` kosong (seed); stress local `IN_PROCESS` untuk IMEI lain.
4. **`src/lib/dhru-fusion.ts`** — mock credit/timeout pada `placeImeiOrderFields`.
5. **`src/app/api/imei/orders/[id]/route.ts`** — RBAC 403 + hook fulfillment stress.
6. **FT**: `scripts/ft/handlers/imei.ts`, helper IMEI di `scripts/ft/lib.ts`, runner `scripts/run-imei-ft.ts`.

---

## Catatan QA

- **Akses UI `/imei`**: `canAccessImeiService` hanya mengizinkan **TEKNISI** & **ADMIN** (bukan USER). Alur katalog/order diuji dengan `ahmad@`; API order USER (`siti@`) tetap 12/12 PASS.
- **Riwayat USER**: `/user/orders/imei` (bukan `/imei/orders` untuk teknisi — redirect ke dashboard teknisi).
- **Duplicate IMEI**: blokir order aktif per `apiId` supplier; tes API memakai IMEI unik / suffix stress agar tidak bentrok antar run.
- **Status DB**: `PENDING` → `IN_PROCESS` → `SUCCESS` | `REJECTED`.
