# Marketplace Complaint Return (RMA) — Implementation Plan

**Goal:** Semua komplain wajib retur barang; pembeli kirim balik dengan foto+video+resi dalam 3 hari; tracking retur; penjual konfirmasi dalam 2 hari pasca DELIVERED atau auto-refund; tolak retur → admin.

**Reference:** `docs/superpowers/specs/2026-06-16-marketplace-complaint-return-rma-design.md`

---

## Phase 1: Schema & enums

- [ ] **1.1** Extend `OrderComplaintStatus`: `AWAITING_RETURN`, `RETURN_SHIPPED`, `AWAITING_SELLER_CONFIRM`, `RETURN_EXPIRED`
- [ ] **1.2** Add `OrderComplaintType`, return tracking fields on `OrderComplaint`
- [ ] **1.3** Extend `OrderComplaintMediaType`: `RETURN_PHOTO`, `RETURN_VIDEO`, `RETURN_REJECT_PHOTO`
- [ ] **1.4** New model `OrderReturnTrackingEvent`
- [ ] **1.5** Migration + `prisma migrate deploy` + `prisma generate`

## Phase 2: Deadlines cron

- [ ] **2.1** `marketplace-return-deadlines.ts` — constants (3 hari retur, 2 hari konfirmasi penjual)
- [ ] **2.2** Job: `OPEN`/`SELLER_RESPONDED` + sellerDeadline lewat → `AWAITING_RETURN` + `returnDeadline`
- [ ] **2.3** Job: `AWAITING_RETURN` + returnDeadline lewat → `RETURN_EXPIRED` + order `SHIPPED`
- [ ] **2.4** Job: `AWAITING_SELLER_CONFIRM` + sellerConfirmDeadline lewat → auto `REFUND_FULL`
- [ ] **2.5** Route cron `marketplace-return-deadlines` + auth

## Phase 3: Buyer return submission

- [ ] **3.1** Validation schema `marketplace-complaint-return.ts`
- [ ] **3.2** Upload media retur (reuse R2 complaint media pipeline)
- [ ] **3.3** `POST /api/user/marketplace/orders/[id]/complaint/return`
- [ ] **3.4** Serializer: `returnDeadline`, status labels, seller return address
- [ ] **3.5** UI: form retur + countdown 3 hari di `marketplace-order-detail-view`

## Phase 4: Return tracking

- [ ] **4.1** `return-tracking-sync.ts` — poll BinderByte for complaint return AWB
- [ ] **4.2** On DELIVERED → `AWAITING_SELLER_CONFIRM` + `sellerConfirmDeadline`
- [ ] **4.3** `GET .../complaint/return/tracking` API
- [ ] **4.4** UI timeline + map for return (reuse `ShippingMap` with return events)

## Phase 5: Seller confirm / reject

- [ ] **5.1** `POST .../complaint/return/confirm` → `resolveComplaintRefundFull`
- [ ] **5.2** `POST .../complaint/return/reject` → `ESCALATED` + reject photos
- [ ] **5.3** Wallet: refund on confirm + auto-refund (escrow v2)
- [ ] **5.4** UI teknisi: buttons + modals on `/teknisi/pesanan`

## Phase 6: Admin & tests

- [ ] **6.1** Admin panel tab Retur — media, resi, reject evidence
- [ ] **6.2** FT-RMA-001 … FT-RMA-008
- [ ] **6.3** Update `docs/functional-tests/02-marketplace.md`

---

## Definition of done

- [ ] Komplain selalu masuk alur retur
- [ ] Pembeli punya 3 hari submit resi + foto + video retur
- [ ] Tracking retur tampil di UI pembeli & penjual
- [ ] Penjual konfirmasi/tolak; auto-refund 2 hari
- [ ] Escrow refund pada konfirmasi/auto-refund
