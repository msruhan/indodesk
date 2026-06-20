# Konsultasi — Konfirmasi Selesai oleh User — Design Spec

**Tanggal**: 2026-06-20  
**Status**: Approved (brainstorming 2026-06-20)  
**Author**: Brainstorming session  

---

## 1. Tujuan

Mencegah kecurangan teknisi yang menekan **Selesai** terlalu dini sehingga dana escrow langsung cair ke wallet teknisi.

**Keberhasilan** diukur dari:

- Teknisi **tidak bisa** memicu payout (`CAPTURED` / `finalizeKonsultasiPaymentToTeknisi`) sendirian.
- User **wajib konfirmasi** layanan selesai sebelum payout (atau timeout 48 jam).
- Escrow tetap aman selama sesi berjalan; payout hanya setelah konfirmasi user atau auto-complete.

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Pendekatan | Konfirmasi user + teknisi tandai selesai dulu (Pendekatan 1) |
| Payout trigger | Hanya saat user konfirmasi **atau** cron timeout |
| Timeout auto-selesai | **48 jam** setelah teknisi menekan "Selesai melayani" |
| Dispute / komplain | **Out of scope v1** — fase berikutnya |
| Sesi ACTIVE saat deploy | Flow baru langsung aktif; teknisi menekan **Selesai melayani** (bukan payout langsung) |
| Rating user | Tetap setelah status `COMPLETED` (tidak berubah) |

---

## 3. State machine

```
AWAITING_PAYMENT → (bayar) → PENDING
PENDING → (teknisi: start) → ACTIVE
ACTIVE → (teknisi: mark-done) → AWAITING_CONFIRMATION
AWAITING_CONFIRMATION → (user: confirm-complete) → COMPLETED + payout
AWAITING_CONFIRMATION → (cron: deadline lewat) → COMPLETED + payout (auto)
```

**Pembatalan (tidak berubah):**

- User: `PENDING` / `AWAITING_PAYMENT` → `CANCELLED` + refund
- Teknisi: `PENDING` / `ACTIVE` → `CANCELLED` (ACTIVE cancel tidak refund — existing behavior)
- User **tidak boleh** cancel saat `ACTIVE` atau `AWAITING_CONFIRMATION`

---

## 4. Perubahan schema

### 4.1 Enum `KonsultasiStatus`

Tambah nilai:

```prisma
enum KonsultasiStatus {
  AWAITING_PAYMENT
  PENDING
  ACTIVE
  AWAITING_CONFIRMATION  // baru
  COMPLETED
  CANCELLED
}
```

### 4.2 Field baru `KonsultasiSession`

| Field | Tipe | Kegunaan |
|-------|------|----------|
| `teknisiMarkedDoneAt` | `DateTime?` | Waktu teknisi menekan "Selesai melayani" |
| `confirmDeadlineAt` | `DateTime?` | `teknisiMarkedDoneAt + 48 jam` — untuk query cron |

Index tambahan:

```prisma
@@index([status, confirmDeadlineAt])
```

### 4.3 Konstanta

File: `src/lib/konsultasi-completion.ts`

```ts
export const KONSULTASI_CONFIRM_TIMEOUT_HOURS = 48
export function computeConfirmDeadline(from: Date): Date
```

---

## 5. Backend — shared completion logic

Ekstrak logika payout ke satu fungsi idempotent (hindari duplikasi teknisi / user / cron):

**File baru:** `src/lib/konsultasi-complete.ts`

```ts
completeKonsultasiSession(
  tx,
  session: KonsultasiSession,
  opts: { source: 'user' | 'auto_timeout'; actorUserId?: string }
): Promise<KonsultasiSession>
```

Perilaku:

1. Validasi status harus `AWAITING_CONFIRMATION` (kecuali idempotent skip jika sudah `COMPLETED`).
2. Update: `status = COMPLETED`, `endedAt = now`, `remoteOtp = null`, `paymentStatus = CAPTURED`.
3. Panggil `finalizeKonsultasiPaymentToTeknisi(...)` (existing).
4. `syncTeknisiCompletedSessions(teknisiId)`.
5. Activity log: `konsultasi.completed` + `konsultasi.earning`.
6. Idempotent: jika sudah `COMPLETED`, return early (no double payout).

---

## 6. API changes

### 6.1 Teknisi — `PATCH /api/teknisi/konsultasi/[id]`

Tambah action **`mark-done`**:

- `ACTIVE → AWAITING_CONFIRMATION`
- Set `teknisiMarkedDoneAt`, `confirmDeadlineAt`, clear `remoteOtp`
- **Tidak payout**

Hapus action `complete` dari schema Zod.

Notifikasi setelah `mark-done`:

- Platform notification ke user: "Teknisi menandai layanan selesai — konfirmasi dalam 48 jam."
- (Opsional v1) Telegram ke user jika template sudah ada — tidak blocking.

### 6.2 User — `PATCH /api/user/konsultasi/[id]`

Tambah action:

```ts
{ action: 'confirm-complete' }
```

Validasi:

- Hanya owner session (`userId`).
- Status harus `AWAITING_CONFIRMATION`.
- Panggil `completeKonsultasiSession(..., { source: 'user' })`.

### 6.3 Cron — `GET|POST /api/cron/konsultasi-confirm-deadlines`

Pola sama dengan `marketplace-order-deadlines`:

- Auth: `validateCronSecret`.
- Query: `status = AWAITING_CONFIRMATION AND confirmDeadlineAt <= now`.
- Batch process (limit 50 per run) via `completeKonsultasiSession(..., { source: 'auto_timeout' })`.
- Return stats: `{ processed, errors }`.

**VPS:** tambah cron entry (hourly atau setiap 15 menit) memanggil endpoint ini.

---

## 7. Serializers & DTO

### 7.1 UI status mapping

Tambah ke `mapKonsultasiUiStatus`:

```ts
case 'AWAITING_CONFIRMATION':
  return 'awaiting_confirmation'
```

Label: **"Menunggu konfirmasi"** (user) / **"Menunggu user"** (teknisi).

### 7.2 `TeknisiKonsultasiDto`

| Field baru | Nilai |
|------------|-------|
| `canMarkDone` | `status === ACTIVE` |
| `canComplete` | **dihapus** / selalu false |
| `confirmDeadlineAt` | ISO string atau null |
| `teknisiMarkedDoneAt` | ISO string atau null |

### 7.3 `UserKonsultasiDto`

| Field baru | Nilai |
|------------|-------|
| `canConfirmComplete` | `status === AWAITING_CONFIRMATION` |
| `confirmDeadlineAt` | ISO string atau null |
| `confirmDeadlineLabel` | Human-readable countdown (client-side dari ISO) |

---

## 8. UI changes

### 8.1 Teknisi — `/teknisi/konsultasi`

| Status | Tombol Aksi |
|--------|-------------|
| `pending` | Mulai · Batalkan · Chat |
| `active` | **Selesai melayani** (bukan "Selesai") · Chat |
| `awaiting_confirmation` | Badge "Menunggu konfirmasi user" + info deadline · Chat (read-only hint) |
| `completed` | — |

Copy tombol `mark-done`: **"Selesai melayani"** dengan konfirmasi dialog singkat: *"User akan diminta konfirmasi. Dana cair setelah user setuju atau otomatis dalam 48 jam."*

Hapus tombol **Selesai** yang langsung payout.

Tab filter: tambah chip **Menunggu konfirmasi** atau map ke tab **Berjalan** / **Semua** — rekomendasi: tampilkan di tab **Berjalan** dengan badge berbeda.

### 8.2 User — `/user/konsultasi`

| Status | Tombol Aksi |
|--------|-------------|
| `active` | Chat |
| `awaiting_confirmation` | **Konfirmasi selesai** (primary) · Chat |
| `completed` | Rating (existing) · Chat |

Dialog konfirmasi user: *"Dana akan dicairkan ke teknisi. Pastikan layanan sudah sesuai."*

Tampilkan countdown: *"Otomatis selesai [tanggal/waktu]"* dari `confirmDeadlineAt`.

### 8.3 Admin monitoring

- Map `AWAITING_CONFIRMATION` → status label + tone `warning`.
- Tampilkan `confirmDeadlineAt` di meta panel konsultasi.

### 8.4 Functional test doc

Update `docs/functional-tests/05-konsultasi.md`:

- FT-KON-004: TEKNISI mark-done (bukan complete langsung).
- FT-KON-004b: USER confirm-complete → payout.
- FT-KON-004c: Auto-complete setelah 48 jam (cron test).

---

## 9. Notifikasi

| Event | Penerima | Channel |
|-------|----------|---------|
| `mark-done` | User | Platform notification (wajib v1) |
| `confirm-complete` | Teknisi | Platform notification |
| `auto_timeout` | User + Teknisi | Platform notification |

Telegram teknisi untuk `konsultasi.completed` payout — tetap setelah `COMPLETED` (existing dispatch jika ada).

---

## 10. Error handling & edge cases

| Kasus | Handling |
|-------|----------|
| Double-click confirm | Idempotent `completeKonsultasiSession` |
| Cron + user confirm bersamaan | Transaction + status check; satu yang menang |
| `confirmDeadlineAt` null tapi status AWAITING_CONFIRMATION | Cron skip; admin fix manual — migration backfill dari `teknisiMarkedDoneAt` |
| Sesi ACTIVE saat deploy | Teknisi masih lihat "Selesai melayani"; tidak ada sesi AWAITING_CONFIRMATION until mark-done |
| Payment belum SECURED | `mark-done` ditolak (sama seperti start) |

---

## 11. Testing

| Level | Cakupan |
|-------|---------|
| Unit | `computeConfirmDeadline`, `completeKonsultasiSession` idempotency |
| API | teknisi mark-done, user confirm-complete, reject wrong status |
| Cron | mock session with deadline passed → COMPLETED + ledger |
| Manual | Flow end-to-end: start → mark-done → user confirm → rating |

---

## 12. Out of scope v1

- Dispute / komplain user saat `AWAITING_CONFIRMATION`
- Reminder push 24 jam sebelum deadline
- Telegram template khusus "konfirmasi selesai" ke user
- Perubahan kebijakan refund legal page

---

## 13. Urutan implementasi (ringkas)

1. Migration schema + konstanta
2. `konsultasi-complete.ts` shared helper
3. API teknisi (`mark-done`) + user (`confirm-complete`)
4. Serializers + UI teknisi/user
5. Cron route + VPS cron
6. Admin monitoring labels
7. Update functional test doc + unit tests
