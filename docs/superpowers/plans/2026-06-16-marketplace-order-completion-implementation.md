# Marketplace Order Completion & Complaint — Implementation Plan

**Goal:** Penjual tidak bisa menandai selesai manual; pembeli konfirmasi/komplain setelah DELIVERED; auto-selesai 3 hari; alur komplain penjual → admin.

**Reference:** `docs/superpowers/specs/2026-06-16-marketplace-order-completion-design.md`

---

## Phase 1: Schema & hapus seller manual complete

- [ ] **1.1** Prisma: `DISPUTED` di `OrderStatus`, field deadline di `Order`, model `OrderComplaint` + `OrderComplaintMedia`, relasi `User`
- [ ] **1.2** Migration SQL + `npx prisma migrate deploy` + `npx prisma generate`
- [ ] **1.3** Hapus `SHIPPED → COMPLETED` di `teknisi/marketplace/orders/[id]/route.ts`
- [ ] **1.4** Update `marketplace-order-serializer.ts`: `sellerNextStatus`, `canAdvanceStatus`, label `disputed`, field DTO baru (stub null dulu)
- [ ] **1.5** UI teknisi: hapus "Tandai Selesai" — `teknisi/pesanan/page.tsx`, `teknisi-marketplace-orders-panel.tsx`
- [ ] **1.6** Verifikasi: `npx tsc --noEmit`; manual — penjual tidak ada tombol selesai di SHIPPED

## Phase 2: Delivered detection & auto-complete cron

- [ ] **2.1** `src/lib/marketplace-order-deadlines.ts` — helper `markOrderDelivered`, `autoCompleteEligibleOrders`, constants (3 hari / 2 hari)
- [ ] **2.2** Hook `order-tracking-sync.ts` — set `deliveredAt` + `buyerActionDeadline` saat tracking pertama kali terminal
- [ ] **2.3** Refactor `confirmMarketplaceOrderReceipt` — ekstrak `completeMarketplaceOrder(orderId, { auto?: boolean })`
- [ ] **2.4** `GET/POST /api/cron/marketplace-order-deadlines` — job delivered backfill, auto-complete, eskalasi komplain (stub eskalasi jika Phase 4 belum)
- [ ] **2.5** Serializer: `deliveredAt`, `buyerActionDeadline`, `canConfirmReceipt` cek deadline
- [ ] **2.6** UI pembeli: countdown deadline di `marketplace-order-detail-view.tsx`
- [ ] **2.7** Verifikasi manual dengan stress mode / mock DELIVERED

## Phase 3: Komplain pembeli (API + upload + UI)

- [ ] **3.1** `src/lib/validations/marketplace-complaint.ts` — reason, media rules
- [ ] **3.2** `src/lib/marketplace-complaint-media.ts` — upload foto (pipeline) + video (validate MIME/size, private R2)
- [ ] **3.3** `src/lib/marketplace-complaint.ts` — `createOrderComplaint`, serializer `OrderComplaintDto`
- [ ] **3.4** `POST /api/user/marketplace/orders/[id]/complaint` — multipart handler
- [ ] **3.5** `POST /api/user/marketplace/orders/[id]/complaint/escalate` — pembeli eskalasi setelah `SELLER_RESPONDED`
- [ ] **3.6** Komponen `marketplace-complaint-form.tsx` — modal alasan + foto + video
- [ ] **3.7** Integrasi di `marketplace-order-detail-view.tsx` + `my-orders-view.tsx` — tombol Komplain, status DISPUTED
- [ ] **3.8** Verifikasi: submit tanpa video ditolak; order → DISPUTED

## Phase 4: Respons penjual & eskalasi cron

- [ ] **4.1** `POST /api/teknisi/marketplace/orders/[id]/complaint/respond`
- [ ] **4.2** UI teknisi pesanan — section komplain + countdown 2 hari + form respons
- [ ] **4.3** Lengkapi cron job eskalasi: `OPEN` + `sellerDeadline` lewat → `ESCALATED`; `SELLER_RESPONDED` + 2 hari → `ESCALATED`
- [ ] **4.4** Notifikasi dasar (log + optional in-app) — komplain baru, respons penjual
- [ ] **4.5** Verifikasi: timeout mock → ESCALATED

## Phase 5: Admin resolve & refund

- [ ] **5.1** `src/lib/marketplace-complaint-resolve.ts` — refund full/partial/reject pakai `refundBuyerForMarketplace` + `debitSellerForMarketplace`
- [ ] **5.2** API admin: `GET complaints`, `GET complaints/[id]`, `POST complaints/[id]/resolve`
- [ ] **5.3** `src/components/admin/admin-marketplace-complaints-panel.tsx` + route `/admin/marketplace-complaints` (atau tab di monitoring)
- [ ] **5.4** Media viewer private untuk admin (reuse `/api/media/private`)
- [ ] **5.5** Verifikasi: admin refund full → wallet pembeli + order REFUNDED

## Phase 6: Notifikasi, tests, docs

- [ ] **6.1** Hook `user-order-notifications` — DELIVERED, reminder H-1, komplain, resolusi
- [ ] **6.2** Functional tests FT-MKT-301 … FT-MKT-308 di `scripts/ft/handlers/`
- [ ] **6.3** Update `docs/functional-tests/02-marketplace.md`
- [ ] **6.4** Seed/backfill: set `deliveredAt` untuk order SHIPPED yang tracking sudah terminal (opsional SQL script)

---

## Task detail — Phase 1.1 Schema

**Files:** `prisma/schema.prisma`, `prisma/migrations/20260616120000_marketplace_order_complaint/migration.sql`

```prisma
enum OrderStatus {
  // … existing
  DISPUTED
}

enum OrderComplaintStatus {
  OPEN
  SELLER_RESPONDED
  ESCALATED
  RESOLVED
  WITHDRAWN
}

enum OrderComplaintResolution {
  REFUND_FULL
  REFUND_PARTIAL
  REJECTED
}

enum OrderComplaintMediaType {
  PHOTO
  VIDEO
}

model Order {
  deliveredAt         DateTime?
  buyerActionDeadline DateTime?
  autoCompletedAt     DateTime?
  complaint           OrderComplaint?
}

model OrderComplaint { /* lihat spec §6.2 */ }
model OrderComplaintMedia { /* lihat spec §6.3 */ }
```

Tambah relasi di `User`:

```prisma
buyerComplaints  OrderComplaint[] @relation("BuyerComplaints")
sellerComplaints OrderComplaint[] @relation("SellerComplaints")
adminComplaints  OrderComplaint[] @relation("AdminComplaintResolutions")
```

---

## Task detail — Phase 1.3 Hapus seller complete

**File:** `src/app/api/teknisi/marketplace/orders/[id]/route.ts`

Hapus case `SHIPPED → COMPLETED` di switch `advance`. Biarkan hanya:

```ts
case 'PAID':
  nextStatus = 'PROCESSING'
  break
// SHIPPED: tidak ada advance — return apiError jika dipanggil
```

**File:** `src/lib/marketplace-order-serializer.ts`

```ts
function sellerNextStatus(db: Order['status']) {
  if (db === 'PAID') return 'PROCESSING'
  return null
}

const canAdvance =
  role === 'seller' &&
  nextStatus != null &&
  row.status === 'PAID' // bukan SHIPPED
```

---

## Task detail — Phase 2.1 Deadlines lib

**File:** `src/lib/marketplace-order-deadlines.ts`

```ts
export const BUYER_ACTION_DAYS = 3
export const SELLER_RESPONSE_DAYS = 2
export const BUYER_ESCALATION_DAYS = 2 // setelah SELLER_RESPONDED

export async function markOrderDelivered(orderId: string): Promise<boolean>
export async function processAutoCompletions(batchSize?: number): Promise<number>
export async function processComplaintEscalations(batchSize?: number): Promise<number>
export async function backfillDeliveredFromTracking(batchSize?: number): Promise<number>
```

`markOrderDelivered` idempotent — skip jika `deliveredAt` sudah ada.

`processAutoCompletions` — query `SHIPPED`, `buyerActionDeadline < now`, no active complaint → `completeMarketplaceOrder(id, { auto: true })`.

---

## Task detail — Phase 2.2 Tracking hook

**File:** `src/lib/order-tracking-sync.ts`

Setelah update `trackingSummaryStatus`, jika terminal dan `deliveredAt` null:

```ts
import { markOrderDelivered } from '@/lib/marketplace-order-deadlines'
// dalam transaction atau setelah:
if (isTerminalTrackingStatus(trackResult.status)) {
  await markOrderDelivered(input.orderId)
}
```

---

## Task detail — Phase 3.4 Complaint API

**File:** `src/app/api/user/marketplace/orders/[id]/complaint/route.ts`

Guards:

1. `session.user.id === order.buyerId`
2. `order.status === 'SHIPPED'`
3. `isTerminalTrackingStatus(order.trackingSummaryStatus)`
4. `buyerActionDeadline == null || buyerActionDeadline > now`
5. Belum ada `OrderComplaint` untuk order ini

Transaction:

1. Upload media → `OrderComplaintMedia[]`
2. Create `OrderComplaint` status `OPEN`, `sellerDeadline = now + 2 days`
3. Update order `status = DISPUTED`

---

## Task detail — Phase 5.1 Resolve

**File:** `src/lib/marketplace-complaint-resolve.ts`

```ts
export async function resolveMarketplaceComplaint(
  complaintId: string,
  adminId: string,
  input: {
    resolution: 'REFUND_FULL' | 'REFUND_PARTIAL' | 'REJECTED'
    refundAmount?: number
    adminNote?: string
  },
)
```

| Resolution | Order status | Wallet |
|------------|--------------|--------|
| REFUND_FULL | REFUNDED | refund total, debit seller total |
| REFUND_PARTIAL | COMPLETED | refund partial, debit seller partial |
| REJECTED | COMPLETED | no movement |

Set complaint `RESOLVED`, `resolvedAt`, `adminId`.

---

## Serializer flags (final)

**File:** `src/lib/marketplace-order-serializer.ts`

```ts
const isAwaitingBuyer =
  isBuyer &&
  row.status === 'SHIPPED' &&
  isTerminalTrackingStatus(row.trackingSummaryStatus) &&
  !row.complaint

const beforeDeadline =
  !row.buyerActionDeadline || row.buyerActionDeadline > new Date()

const canConfirmReceipt = isAwaitingBuyer && beforeDeadline
const canFileComplaint = canConfirmReceipt

const canEscalateComplaint =
  isBuyer &&
  row.complaint?.status === 'SELLER_RESPONDED'

const canRespondToComplaint =
  role === 'seller' &&
  row.complaint?.status === 'OPEN' &&
  row.complaint.sellerDeadline > new Date()
```

Map `DISPUTED` → UI status `disputed`, label "Komplain".

---

## Cron registration

Tambahkan ke dokumentasi deploy / scheduler (sama interval tracking):

```
GET /api/cron/marketplace-order-deadlines
Authorization: Bearer $CRON_SECRET
```

Bisa dipanggil dari worker yang sama setelah `order-tracking` atau terpisah setiap 15 menit.

---

## Verification

```bash
cd indoteknizi && npx prisma migrate deploy && npx prisma generate
npx tsc --noEmit
npm run build:fast
```

### Manual checklist

1. Login teknisi → pesanan SHIPPED → **tidak ada** "Tandai Selesai"
2. Mock DELIVERED → pembeli lihat countdown + 2 tombol
3. Konfirmasi → COMPLETED
4. Order baru → komplain dengan foto+video → DISPUTED
5. Penjual respons → SELLER_RESPONDED
6. Admin resolve refund → wallet + status

### Functional tests (Phase 6)

Extend `scripts/ft/handlers/marketplace.ts` (atau buat file baru):

- FT-MKT-301: PATCH advance SHIPPED → expect 400
- FT-MKT-302: confirm after delivered
- FT-MKT-303: complaint without video → 400
- FT-MKT-304: set `buyerActionDeadline` past → cron → COMPLETED
- FT-MKT-305–308: complaint lifecycle

---

## Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Video upload besar | Max 50 MB, validasi server-side |
| Race auto-complete vs komplain | Transaction + cek complaint aktif di kedua path |
| Order lama tanpa `deliveredAt` | Cron backfill dari tracking terminal |
| Seller balance < refund | Tangkap `INSUFFICIENT_SELLER_BALANCE`, tampilkan ke admin |

---

## Estimasi urutan PR (opsional split)

| PR | Isi |
|----|-----|
| PR-1 | Phase 1 + 2 (schema, hapus manual complete, cron deadline) |
| PR-2 | Phase 3 (komplain pembeli) |
| PR-3 | Phase 4 + 5 (penjual + admin) |
| PR-4 | Phase 6 (notifikasi + tests) |
