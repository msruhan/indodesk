# Batch 6 — Remote Browser Test Report — 2026-05-26

**Mode**: Cursor browser + API (`scripts/run-remote-ft.ts`)  
**Base URL**: http://localhost:3000  
**Akun**: `siti@gmail.com`, `ahmad@indoteknizi.com`, `rudi@gmail.com` / `password123`

---

## Ringkasan

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 9 |
| ⚠️ PARTIAL | 0 |
| ⏭️ BLOCKED | **0** |
| ❌ FAIL | 0 |

**API**: 9/9 PASS — [`2026-05-26-batch6-remote-api.md`](./2026-05-26-batch6-remote-api.md)

---

## Hasil per skenario

| ID | Skenario | Status | Catatan |
|----|----------|--------|---------|
| FT-REM-001 | USER request remote session | ✅ PASS | `/remote` → pilih Ahmad → ID `987 654 321` + OTP + deskripsi → **Ajukan Remote Session** → tampil di `/user/remote` **Menunggu** |
| FT-REM-002 | Download IndoDesk client | ✅ PASS | Link **Windows** & **macOS** dari `/api/indodesk/downloads` (v1.3.7) |
| FT-REM-003 | TEKNISI accept → IN_PROGRESS | ✅ PASS | `ahmad@` → `/teknisi/remote` → **Terima** → sesi pindah ke **Sesi aktif** |
| FT-REM-004 | TEKNISI mark COMPLETED | ✅ PASS | **Selesai** pada sesi aktif → riwayat **Selesai** |
| FT-REM-101 | Request tanpa auth | ✅ PASS | API 401 |
| FT-REM-102 | Remote ID invalid | ✅ PASS | API 400 (Zod min 6 karakter) |
| FT-REM-103 | Description kosong | ✅ PASS | API 400 + tombol submit disabled jika deskripsi kosong (UI) |
| FT-REM-201 | TEKNISI reject | ✅ PASS | API `action: reject` → status **rejected**; UI tombol **Tolak** tersedia |
| FT-REM-901 | RBAC user lain | ✅ PASS | API GET/PATCH `/api/user/remote/[id]` oleh rudi → **403** |

---

## Perubahan kode (batch 6)

1. **`description` wajib** di `POST /api/remote` (min 1 karakter).
2. **RBAC 403** pada `GET` + `PATCH` `/api/user/remote/[id]` dan `PATCH` `/api/teknisi/remote/[id]` (bukan 404).
3. **FT handlers** lengkap di `scripts/ft/handlers/remote.ts` + helper `requestRemoteSession()` / `remoteRequestBody()`.
4. **Runner** `scripts/run-remote-ft.ts`.
5. **UI** `/remote`: submit disabled jika deskripsi kosong.

---

## Catatan QA

- Status UI: `waiting` / `active` / `completed` / `rejected` (map dari DB `WAITING` / `IN_PROGRESS` / `COMPLETED` / `REJECTED`).
- Aksi teknisi: **Terima** = `accept`, **Tolak** = `reject`, **Selesai** = `complete`.
- Remote **gratis** (tidak ada debit wallet seperti konsultasi).
