# Marketplace Order Cancellation (Tokopedia-style) — Design Spec

**Tanggal**: 2026-06-21  
**Status**: Approved — implemented 2026-06-21  
**Author**: Brainstorming session  
**Relates to**:
- `2026-06-16-marketplace-escrow-fees-design.md`
- `2026-06-17-marketplace-order-documentation-design.md`
- `2026-06-16-marketplace-order-completion-design.md`

---

## 1. Tujuan

Menambahkan mekanisme **pembatalan pesanan marketplace** dari sisi **pembeli** dan **penjual**, mengikuti pola umum marketplace (referensi: Tokopedia):

1. Pembeli dapat membatalkan **sebelum bayar**.
2. Pembeli dapat membatalkan **instan** dalam window singkat setelah bayar, selama pesanan belum diproses/dikirim.
3. Pembeli dapat **mengajukan pembatalan** yang memerlukan persetujuan penjual jika sudah lewat window instan atau pesanan sudah diproses (tapi belum dikirim).
4. Penjual dapat **menolak pesanan baru** (stok habis, dll.) saat belum memproses.
5. Penjual merespons pengajuan pembatalan pembeli dalam **48 jam**; jika menolak atau diam, pesanan **tetap berjalan**.
6. Semua refund masuk **Saldo Bantoo (wallet)** — pembeli withdraw ke rekening; **bukan** refund langsung ke channel Tripay (v1).

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Refund channel v1 | **Saldo Bantoo (wallet)** universal — PG & future wallet-pay |
| Copy UI refund | *"Dana dikembalikan ke Saldo Bantoo. Tarik ke rekening dari menu Saldo."* |
| Refund nominal | **Full `buyerHoldAmount`** (subtotal − diskon + fee pembeli + ongkir) |
| Batalkan sebelum bayar | Sudah ada — `AWAITING_PAYMENT` → `CANCELLED`, stok restore, expire payment intent |
| Batalkan instan pembeli | ≤ **1 jam** sejak `paidAt`, status **`PAID`**, belum **`PROCESSING`** / **`SHIPPED`** |
| Kuota batalkan instan | **Tidak ada batas kuota** (sesuai brief user) |
| Ajukan pembatalan pembeli | Setelah lewat 1 jam **atau** status sudah **`PROCESSING`** (belum **`SHIPPED`**) |
| Deadline respons penjual | **48 jam** sejak pengajuan |
| Penjual setuju | Cancel + refund wallet + restore stock |
| Penjual tolak / timeout | Request `REJECTED` / `EXPIRED`; **order tidak dibatalkan**, lanjut diproses/dikirim |
| Penjual tolak pesanan baru | Status **`PAID`**, belum **`PROCESSING`** — label UI **"Tolak Pesanan"** |
| Alasan wajib | Min. **20 karakter** (semua cancel/reject/request) |
| Produk digital/software | **Out of scope** — tidak ada gate packaging; aturan cancel sama jika ada order digital nanti |
| Tripay refund API | **Out of scope v1** — fase 2 jika dibutuhkan |
| `OrderCancelledBy` | Tambah **`BUYER`** |

### 2.1 Mapping status Bantoo ↔ istilah bisnis

| Istilah user | Status Bantoo | Catatan |
|--------------|---------------|---------|
| Menunggu pembayaran | `AWAITING_PAYMENT` | Cancel instan pembeli (existing) |
| Menunggu konfirmasi penjual | `PAID` | Belum `advance` ke PROCESSING |
| Diproses | `PROCESSING` | Penjual sudah proses; packaging approved (fisik) |
| Dalam pengiriman | `SHIPPED`+ | **Tidak bisa** batalkan/ajukan (gunakan komplain) |
| Pengajuan pembatalan aktif | Order tetap status asli + `OrderCancellationRequest.PENDING` | Badge UI terpisah |

---

## 3. Konteks codebase

| Komponen | Kondisi saat ini | Perlu diubah |
|----------|------------------|--------------|
| User cancel | Hanya `AWAITING_PAYMENT` (`/api/user/marketplace/orders/[id]/cancel`) | Perluas instant + request flow |
| Seller cancel | `PAID`/`PROCESSING` + reason → `refundBuyerHoldForMarketplace` | Tambah guard PAID-only untuk "Tolak Pesanan"; reuse untuk approve request |
| `OrderCancelledBy` | `SELLER`, `ADMIN`, `SYSTEM` | Tambah `BUYER` |
| `Order.paidAt` | Tidak ada | Tambah; set saat Tripay fulfill → `PAID` |
| `Order.processingAt` | Tidak ada | Tambah; set saat `advance` → `PROCESSING` |
| Checkout PG | Tripay → `PAID` tanpa `ESCROW_HOLD` | Refund v1 tetap **kredit wallet** (platform liability) |
| Packaging gate | Fisik: `PAID` → packaging → approve → `PROCESSING` | Instant cancel allowed di `PAID` meski packaging pending |
| Complaint flow | Terpisah untuk post-`SHIPPED` | Tidak overlap dengan cancel request |
| Cron deadlines | `marketplace-order-deadlines`, packaging timeout | Tambah job expire cancel request 48h |

---

## 4. Model data

### 4.1 Perubahan `Order`

```prisma
paidAt        DateTime?  // set when status → PAID
processingAt  DateTime?  // set when status → PROCESSING
```

### 4.2 Enum

```prisma
enum OrderCancelledBy {
  BUYER    // baru
  SELLER
  ADMIN
  SYSTEM
}

enum OrderCancellationRequestStatus {
  PENDING
  APPROVED
  REJECTED
  WITHDRAWN   // pembeli tarik pengajuan (opsional v1)
  EXPIRED     // penjual tidak respons 48 jam
}

enum OrderCancellationKind {
  INSTANT           // pembeli batalkan langsung (tanpa request row, atau row resolved immediately)
  APPROVAL_REQUIRED // pengajuan ke penjual
}
```

### 4.3 Model baru `OrderCancellationRequest`

```prisma
model OrderCancellationRequest {
  id               String   @id @default(cuid())
  orderId          String   @unique  // max satu request aktif per order
  buyerId          String
  sellerId         String
  reason           String   @db.Text
  kind             OrderCancellationKind
  status           OrderCancellationRequestStatus @default(PENDING)
  sellerDeadline   DateTime?  // createdAt + 48h untuk APPROVAL_REQUIRED
  sellerResponse   String?    @db.Text
  resolvedAt       DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([sellerId, status])
  @@index([status, sellerDeadline])
}
```

**Catatan:** Untuk **instant cancel** pembeli, tidak wajib membuat row request — cukup update order + refund. Row request hanya untuk alur **APPROVAL_REQUIRED**.

---

## 5. Alur bisnis detail

### 5.1 Pembeli — sebelum bayar (existing)

```
AWAITING_PAYMENT
  → user cancel
  → CANCELLED, cancelledBy: BUYER (baru)
  → restore stock, expire UNPAID payment intent
  → tidak ada refund wallet (belum bayar)
```

### 5.2 Pembeli — batalkan instan (post-pay)

**Guard (semua harus true):**

- `status === PAID`
- `paidAt != null` && `now <= paidAt + 1 hour`
- `processingAt == null` (belum PROCESSING)
- Tidak ada `OrderCancellationRequest` dengan status `PENDING`
- Tidak ada complaint aktif

**Aksi:**

1. Restore stock per item
2. `refundBuyerHoldForMarketplace(buyerId, buyerHoldAmount, orderId, ...)`
3. Order → `CANCELLED`, `cancelledBy: BUYER`, `cancelReason`
4. Notifikasi penjual + activity log

### 5.3 Pembeli — ajukan pembatalan

**Guard:**

- `status === PAID` (lewat 1 jam) **OR** `status === PROCESSING`
- `status !== SHIPPED` (dan bukan terminal)
- Belum ada request `PENDING` untuk order ini
- Body: `reason` min 20 karakter

**Aksi:**

1. Create `OrderCancellationRequest` — `kind: APPROVAL_REQUIRED`, `status: PENDING`, `sellerDeadline = now + 48h`
2. Order **tetap** status saat ini
3. Notifikasi penjual (Telegram + in-app jika ada)

**UI pembeli:** tombol **"Ajukan pembatalan"** + tampilkan countdown deadline respons penjual.

### 5.4 Penjual — tolak pesanan baru

**Guard:**

- `status === PAID`
- `processingAt == null`
- Alasan min 20 karakter

**Aksi:** sama dengan seller cancel existing — `CANCELLED`, `cancelledBy: SELLER`, refund wallet, restore stock.

**UI:** rename/tombol **"Tolak Pesanan"** (bukan "Batalkan") saat kondisi di atas; tombol **"Batalkan"** tetap untuk `PROCESSING` (seller-initiated cancel).

### 5.5 Penjual — respons pengajuan pembeli

**Approve (`action: approve_cancel_request`):**

- Guard: request `PENDING`, `now <= sellerDeadline`
- Refund + cancel order (sama §5.2 step refund)
- Request → `APPROVED`
- Notifikasi pembeli: refund ke Saldo Bantoo

**Reject (`action: reject_cancel_request`):**

- Request → `REJECTED`, simpan `sellerResponse` (min 20 char opsional)
- Order **tidak berubah**
- Notifikasi pembeli

**Timeout (cron):**

- Request `PENDING` && `sellerDeadline < now` → `EXPIRED`
- Order **tidak berubah** (pesanan tetap dikirim/diproses)

### 5.6 Status yang tidak bisa dibatalkan

`SHIPPED`, `DISPUTED`, `COMPLETED`, `CANCELLED`, `REFUNDED`, `AWAITING_PAYMENT` (gunakan flow existing).

---

## 6. Refund wallet (keputusan A)

Semua refund pembatalan memanggil `refundBuyerHoldForMarketplace`:

| Sumber pembayaran | Perilaku v1 |
|-------------------|-------------|
| Tripay (OVO/VA/QRIS) | Kredit **Saldo Bantoo** = `buyerHoldAmount` |
| Wallet (future) | Sama — idempotent via ledger `REFUND` |

**Platform accounting (v1):** Dana PG sudah masuk merchant Tripay; refund wallet = **liability platform** — dokumentasikan untuk admin finance (out of scope: rekonsiliasi otomatis).

**Idempotensi:** Cek ledger `REFUND` + `referenceId = orderId` sebelum kredit (sudah ada di `refundBuyerHoldForMarketplace`).

---

## 7. API

### 7.1 Pembeli

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/user/marketplace/orders/[id]/cancel` | Pre-pay (existing) **atau** instant post-pay (perluas) |
| `POST` | `/api/user/marketplace/orders/[id]/cancel-request` | Ajukan pembatalan `{ reason }` |
| `DELETE` | `/api/user/marketplace/orders/[id]/cancel-request` | Tarik pengajuan (opsional v1) |

### 7.2 Penjual

Perluas `PATCH /api/teknisi/marketplace/orders/[id]`:

| action | Deskripsi |
|--------|-----------|
| `cancel` | Existing — PAID/PROCESSING + reason |
| `reject_order` | Alias guard ketat: hanya `PAID`, belum processing |
| `approve_cancel_request` | Setujui pengajuan pembeli |
| `reject_cancel_request` | Tolak pengajuan `{ response? }` |

### 7.3 Serializer flags (`MarketplaceOrderDto`)

| Field | Kondisi |
|-------|---------|
| `canCancelAwaitingPayment` | buyer && `AWAITING_PAYMENT` |
| `canCancelInstant` | buyer && PAID && within 1h && !processingAt |
| `canRequestCancellation` | buyer && (PAID past 1h \|\| PROCESSING) && !SHIPPED && !pending request |
| `canRejectNewOrder` | seller && PAID && !processingAt |
| `canRespondToCancelRequest` | seller && request PENDING && before deadline |
| `cancellationRequest` | DTO nested: status, reason, deadline, sellerResponse |

---

## 8. UI

### 8.1 Pembeli

| Lokasi | Perilaku |
|--------|----------|
| Popup detail pesanan / detail page | Satu primary action sesuai flag |
| Menunggu bayar | **Batalkan pesanan** |
| PAID ≤1 jam | **Batalkan pesanan** + hint *"Batalkan instan tanpa persetujuan penjual"* |
| PAID >1 jam / PROCESSING | **Ajukan pembatalan** + form alasan |
| Request pending | Badge *"Menunggu respons penjual"* + countdown 48 jam |
| Setelah cancel/refund | Toast/link ke **Saldo** dengan copy refund wallet |

### 8.2 Penjual

| Lokasi | Perilaku |
|--------|----------|
| Pesanan PAID baru | **Tolak Pesanan** (destructive) |
| Request pending | **Setujui pembatalan** / **Tolak** + optional alasan |
| PROCESSING | **Batalkan pesanan** (existing, alasan wajib) |

---

## 9. Notifikasi & cron

| Event | Penerima | Channel |
|-------|----------|---------|
| Instant cancel pembeli | Penjual | Telegram + notif in-app |
| Pengajuan pembatalan | Penjual | Telegram + notif |
| Approve/reject | Pembeli | Notif in-app |
| Request expiring (24h left) | Penjual | Opsional v1 |
| Request expired | Pembeli | Notif: pesanan lanjut |

**Cron baru** (`marketplace-cancellation-deadlines.ts`):

- Setiap 15–60 menit: `PENDING` + `sellerDeadline < now` → `EXPIRED`

---

## 10. Error handling

| Error | HTTP | Pesan user |
|-------|------|------------|
| Window 1 jam lewat | 400 | *"Pembatalan instan hanya tersedia 1 jam setelah pembayaran"* |
| Sudah SHIPPED | 400 | *"Pesanan sudah dikirim. Ajukan komplain jika ada masalah."* |
| Request sudah ada | 409 | *"Pengajuan pembatalan masih menunggu respons penjual"* |
| Refund sudah ada | 409 | *"Pesanan sudah direfund"* |
| Alasan terlalu pendek | 400 | Min 20 karakter |

---

## 11. Testing (functional)

| ID | Skenario |
|----|----------|
| CAN-01 | User cancel AWAITING_PAYMENT |
| CAN-02 | User instant cancel PAID within 1h → wallet REFUND ledger |
| CAN-03 | User instant cancel rejected after 1h |
| CAN-04 | User submit cancel request on PROCESSING |
| CAN-05 | Seller approve → CANCELLED + refund |
| CAN-06 | Seller reject → order unchanged |
| CAN-07 | Cron expire 48h → EXPIRED, order unchanged |
| CAN-08 | Seller reject new order PAID |
| CAN-09 | Idempotent refund — double approve tidak double credit |

---

## 12. Out of scope v1

- Tripay Refund API (refund ke OVO/VA langsung)
- Kuota/harian batalkan instan per user
- Admin override cancel request
- Partial refund on cancellation
- Produk digital/software khusus

---

## 13. Fase implementasi (urutan disarankan)

1. Schema migration (`paidAt`, `processingAt`, `BUYER`, `OrderCancellationRequest`)
2. Set `paidAt` / `processingAt` di fulfill & advance existing
3. Perluas user cancel API (instant) + wallet refund
4. Cancel request API + seller approve/reject
5. Cron expire + notifications
6. Serializer flags + UI pembeli & penjual
7. Functional tests CAN-01 … CAN-09

---

## 14. Self-review checklist

- [x] Tidak ada placeholder TBD pada keputusan inti
- [x] Konsisten dengan escrow doc (`refundBuyerHoldForMarketplace`, full hold)
- [x] Konsisten dengan packaging doc (instant cancel di PAID meski packaging pending)
- [x] Refund A (wallet) eksplisit di §2 dan §6
- [x] Timeout penjual = order lanjut (sesuai brief Tokopedia)
- [x] Scope cukup untuk satu implementation plan
