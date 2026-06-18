# Marketplace Order Documentation — Implementation Plan

**Goal:** Wajibkan bukti packaging (penjual + review admin) sebelum proses pesanan; perketat komplain pembeli dengan video unboxing + foto masalah.

**Reference:** `docs/superpowers/specs/2026-06-17-marketplace-order-documentation-design.md`

---

## Phase 1: Schema & serializer gates

- [ ] **1.1** Prisma: `OrderPackagingProofStatus`, `OrderPackagingProof`, `OrderPackagingMedia`
- [ ] **1.2** Extend `OrderComplaintMediaType`: `UNBOXING_VIDEO`, `DEFECT_PHOTO` (keep legacy PHOTO/VIDEO)
- [ ] **1.3** Migration SQL + `prisma migrate deploy`
- [ ] **1.4** `src/lib/marketplace-packaging-proof-serializer.ts` — DTO + labels
- [ ] **1.5** Update `marketplace-order-serializer.ts`:
  - `requiresPackagingProof`, `canSubmitPackagingProof`
  - `canAdvanceStatus` only if `packagingProof?.status === APPROVED` (seller, PAID)
  - Skip gates for software/digital line items (v1: all items software → skip)
- [ ] **1.6** Include `packagingProof` in `MARKETPLACE_ORDER_INCLUDE`

## Phase 2: Packaging upload API (teknisi)

- [ ] **2.1** `src/lib/marketplace-packaging-media.ts` — reuse pattern from `marketplace-complaint-media.ts`
- [ ] **2.2** `src/lib/marketplace-packaging-proof.ts` — `submitPackagingProof`, `getPackagingProof`
- [ ] **2.3** `POST/GET /api/teknisi/marketplace/orders/[id]/packaging`
- [ ] **2.4** Block `PATCH advance` PAID→PROCESSING if packaging not APPROVED
- [ ] **2.5** Verifikasi: `tsc` + manual — Proses disabled tanpa approve

## Phase 3: Admin packaging review

- [ ] **3.1** `src/lib/marketplace-packaging-review.ts` — approve/reject
- [ ] **3.2** API admin: list, detail, review
- [ ] **3.3** `src/components/admin/admin-marketplace-packaging-panel.tsx`
- [ ] **3.4** Route/tab admin (monitoring atau `/admin/marketplace-packaging`)
- [ ] **3.5** Verifikasi: approve unlocks seller advance

## Phase 4: UI penjual

- [ ] **4.1** `src/components/marketplace/packaging-proof-form.tsx`
- [ ] **4.2** Integrate `teknisi/pesanan/page.tsx` — banner PAID, form, status rejected
- [ ] **4.3** Integrate `teknisi-marketplace-orders-panel.tsx`
- [ ] **4.4** Disable "Proses Pesanan" until approved; show rejection countdown

## Phase 5: Cron & cancel on resubmit timeout

- [ ] **5.1** `processPackagingSlaNotifications()` — PENDING > 24h, set `slaNotifiedAt`
- [ ] **5.2** `processPackagingResubmitTimeouts()` — REJECTED + deadline passed → cancel + refund
- [ ] **5.3** Wire into `/api/cron/marketplace-order-deadlines`
- [ ] **5.4** Field `slaNotifiedAt` on `OrderPackagingProof` (migration if not in 1.1)

## Phase 6: Komplain pembeli (form + validasi)

- [ ] **6.1** Update `marketplace-complaint-media.ts` / validation for `UNBOXING_VIDEO` + `DEFECT_PHOTO`
- [ ] **6.2** Update `createMarketplaceOrderComplaint` — require 1+1 categories
- [ ] **6.3** Update `MarketplaceComplaintForm` — two sections + instruksi UI
- [ ] **6.4** Update `marketplace-order-complaint-serializer` labels per media type
- [ ] **6.5** Verifikasi: komplain tanpa unboxing video → 400

## Phase 7: Notifikasi & tests

- [ ] **7.1** Hooks notifikasi (penjual PAID, admin pending, approve/reject)
- [ ] **7.2** FT-MKT-401 … FT-MKT-408
- [ ] **7.3** Update `docs/functional-tests/02-marketplace.md`

---

## Task detail — Phase 1.1 Schema

```prisma
enum OrderPackagingProofStatus {
  PENDING
  APPROVED
  REJECTED
}

enum OrderPackagingMediaType {
  PHOTO
  VIDEO
}

model OrderPackagingProof {
  id               String @id @default(cuid())
  orderId          String @unique
  sellerId         String
  status           OrderPackagingProofStatus @default(PENDING)
  rejectionNote    String? @db.Text
  submittedAt      DateTime?
  rejectedAt       DateTime?
  resubmitDeadline DateTime?
  reviewedAt       DateTime?
  reviewedById     String?
  slaNotifiedAt    DateTime?
  // relations …
}

model Order {
  packagingProof OrderPackagingProof?
}
```

Extend complaint enum:

```sql
ALTER TYPE "OrderComplaintMediaType" ADD VALUE IF NOT EXISTS 'UNBOXING_VIDEO';
ALTER TYPE "OrderComplaintMediaType" ADD VALUE IF NOT EXISTS 'DEFECT_PHOTO';
```

---

## Task detail — Phase 2.5 Block advance

**File:** `src/app/api/teknisi/marketplace/orders/[id]/route.ts`

Before `PAID → PROCESSING`:

```ts
const proof = await prisma.orderPackagingProof.findUnique({ where: { orderId: id } })
if (!proof || proof.status !== 'APPROVED') {
  return apiError('Upload dan tunggu persetujuan bukti packaging terlebih dahulu')
}
```

Skip check if order contains only software items (helper `orderRequiresPhysicalPackaging(order)`).

---

## Task detail — Phase 5.2 Cancel on timeout

Reuse cancel transaction from teknisi order PATCH `action: cancel`:

- Refund buyer
- Debit seller
- Set order `CANCELLED`
- Set proof status remains `REJECTED` (or add `EXPIRED` — optional)

---

## Task detail — Phase 6.1 Complaint validation

```ts
const unboxingVideos = media.filter(m => m.type === 'UNBOXING_VIDEO')
const defectPhotos = media.filter(m => m.type === 'DEFECT_PHOTO')
if (unboxingVideos.length < 1) throw new Error('UNBOXING_VIDEO_REQUIRED')
if (defectPhotos.length < 1) throw new Error('DEFECT_PHOTO_REQUIRED')
```

Form fields: `unboxingVideos[]`, `defectPhotos[]` (multipart).

---

## Serializer gates (final)

```ts
const isPhysicalOrder = row.items.some(/* not SOFTWARE category */)

const packagingApproved = row.packagingProof?.status === 'APPROVED'

const requiresPackagingProof =
  role === 'seller' && row.status === 'PAID' && isPhysicalOrder && !packagingApproved

const canSubmitPackagingProof =
  role === 'seller' &&
  row.status === 'PAID' &&
  isPhysicalOrder &&
  row.packagingProof?.status !== 'PENDING' &&
  (row.packagingProof?.status !== 'REJECTED' ||
    (row.packagingProof.resubmitDeadline != null &&
      row.packagingProof.resubmitDeadline > new Date()))

const canAdvance =
  role === 'seller' &&
  row.status === 'PAID' &&
  isPhysicalOrder &&
  packagingApproved
```

---

## PR split (suggested)

| PR | Content |
|----|---------|
| PR-1 | Phase 1–2 (schema + teknisi API + gate) |
| PR-2 | Phase 3–4 (admin + teknisi UI) |
| PR-3 | Phase 5–6 (cron + komplain form) |
| PR-4 | Phase 7 (notifikasi + tests) |

---

## Verification

```bash
cd indoteknizi && npx prisma migrate deploy && npx prisma generate
npx tsc --noEmit
```

### Manual checklist

1. Checkout produk fisik → teknisi lihat banner PAID
2. Upload packaging → admin approve → Proses enabled
3. Admin reject → resubmit atau tunggu 3 hari (cron test)
4. Pembeli komplain: wajib video unboxing + foto masalah
5. Pembeli "Pesanan Sesuai" tanpa upload — masih works
