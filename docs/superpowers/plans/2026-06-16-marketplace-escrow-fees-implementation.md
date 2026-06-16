# Marketplace Escrow, Dual Fees & Seller Cancellation — Implementation Plan

**Goal:** Hold dana pembeli saat checkout; kredit teknisi hanya saat COMPLETED (neto fee); dual fee platform; pembatalan penjual dengan alasan; breakdown saldo escrow.

**Reference:** `docs/superpowers/specs/2026-06-16-marketplace-escrow-fees-design.md`  
**Depends on:** `2026-06-16-marketplace-order-completion` (confirm/complaint/cron) — bisa paralel sebagian

---

## Phase 1: Schema & platform settings

- [ ] **1.1** Prisma `Order`: `buyerFeeAmount`, `sellerFeeAmount`, `buyerHoldAmount`, `sellerNetAmount`, `cancelReason`, `cancelledBy`, `settlementVersion` (default 2)
- [ ] **1.2** Prisma enum `OrderCancelledBy` (SELLER, ADMIN, SYSTEM)
- [ ] **1.3** Migration + `npx prisma migrate deploy` + `npx prisma generate`
- [ ] **1.4** `platform-settings-shared.ts`: ganti `feePercent` → `buyerFeePercent` + `sellerFeePercent`; migrasi key DB
- [ ] **1.5** `platform-settings.ts`: update KEY_MAP, dtoToRows, validasi PATCH (0–100)
- [ ] **1.6** `AdminMarketplaceFinanceForm.tsx` + embed di `admin/settings/page.tsx`
- [ ] **1.7** Hapus field fee tunggal dari `AdminPlatformSettingsForm.tsx`
- [ ] **1.8** `computeMarketplaceFees(subtotal, settings)` di `src/lib/marketplace-fees.ts`

## Phase 2: Wallet hold / release / refund

- [ ] **2.1** `holdBuyerForMarketplace` — ESCROW_HOLD, idempotent
- [ ] **2.2** `releaseSellerForMarketplace` — EARNING neto, idempotent
- [ ] **2.3** `refundBuyerHoldForMarketplace` — REFUND full/partial
- [ ] **2.4** `logPlatformFeeForOrder` — activity log metadata (v1 tanpa wallet platform)
- [ ] **2.5** Unit-style test inline di `scripts/` atau FT stub untuk fee math

## Phase 3: Checkout migration

- [ ] **3.1** `marketplace-checkout.ts`: hitung & simpan fee fields; panggil `holdBuyerForMarketplace`; **hapus** `creditSellerForMarketplace`
- [ ] **3.2** `cart/page.tsx`: tampilkan baris fee pembeli + total
- [ ] **3.3** `ensureMarketplaceOrderSettlement` — deprecate atau restrict ke `settlementVersion === 1` legacy only
- [ ] **3.4** Verifikasi manual: checkout → ledger ESCROW_HOLD, teknisi saldo tidak naik

## Phase 4: Release on completion

- [ ] **4.1** `completeMarketplaceOrder`: panggil `releaseSellerForMarketplace` + `logPlatformFeeForOrder`
- [ ] **4.2** Guard: skip release jika `settlementVersion === 1` dan sudah ada EARNING legacy
- [ ] **4.3** Cron auto-complete: inherit release via `completeMarketplaceOrder`
- [ ] **4.4** `marketplace-complaint-resolve.ts`: REFUND_FULL/PARTIAL/REJECTED pakai fungsi hold baru
- [ ] **4.5** Verifikasi: confirm receipt → teknisi +sellerNetAmount

## Phase 5: Seller cancellation with reason

- [ ] **5.1** PATCH schema: `cancel` + `reason` min 20
- [ ] **5.2** Route: `refundBuyerHoldForMarketplace`; hapus `debitSellerForMarketplace`; simpan `cancelReason`, `cancelledBy`
- [ ] **5.3** UI modal pembatalan di `teknisi/pesanan/page.tsx` + `teknisi-marketplace-orders-panel.tsx`
- [ ] **5.4** Tampilkan alasan pembatalan di detail order pembeli & admin

## Phase 6: Wallet breakdown UI

- [ ] **6.1** `GET /api/wallet`: tambah `heldBalance`, `totalBalance`, `pendingHolds[]`
- [ ] **6.2** `teknisi-saldo-view.tsx` + user saldo: kartu breakdown
- [ ] **6.3** `wallet-transaction-history.tsx`: label ESCROW_HOLD / REFUND yang jelas
- [ ] **6.4** Teknisi: kartu "Pendapatan Menunggu" dari order pre-COMPLETED

## Phase 7: Serializer, tests, legacy

- [ ] **7.1** `marketplace-order-serializer.ts`: fee fields (admin/teknisi view); `cancelReason` read-only
- [ ] **7.2** FT-ESC-001 … FT-ESC-009 di `scripts/ft/handlers/`
- [ ] **7.3** Update `docs/functional-tests/02-marketplace.md`
- [ ] **7.4** SQL/script: set `settlementVersion = 1` untuk order yang sudah punya EARNING pre-migration
- [ ] **7.5** Amend note di `2026-06-16-marketplace-order-completion-design.md` §14 pointing ke spec escrow

---

## Task detail — Phase 2.1 holdBuyerForMarketplace

**File:** `src/lib/marketplace-wallet.ts`

```ts
export async function holdBuyerForMarketplace(
  tx: TxClient,
  buyerId: string,
  amount: Decimal,
  orderId: string,
  orderCode: string,
) {
  const existing = await tx.walletLedger.findFirst({
    where: { type: 'ESCROW_HOLD', referenceId: orderId, wallet: { userId: buyerId } },
  })
  if (existing) return

  // deduct balance + create ESCROW_HOLD (mirror holdRekberFunds)
}
```

---

## Task detail — Phase 3.1 checkout fee snapshot

**File:** `src/lib/marketplace-checkout.ts`

```ts
const settings = await getPlatformSettings()
const { buyerFee, sellerFee, buyerHold, sellerNet } = computeMarketplaceFees(total, settings)

await tx.order.create({
  data: {
    // ...
    buyerFeeAmount: buyerFee,
    sellerFeeAmount: sellerFee,
    buyerHoldAmount: buyerHold,
    sellerNetAmount: sellerNet,
    settlementVersion: 2,
  },
})

await holdBuyerForMarketplace(tx, buyerId, buyerHold, order.id, orderCode)
```

---

## Task detail — Phase 6.1 heldBalance aggregate

```ts
const activeStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DISPUTED'] as const
const holds = await prisma.order.aggregate({
  where: { buyerId: userId, status: { in: activeStatuses }, settlementVersion: 2 },
  _sum: { buyerHoldAmount: true },
})
```

Exclude order yang sudah punya REFUND ledger untuk referenceId tersebut.

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Double release | Idempotent ledger checks |
| Legacy orders break | `settlementVersion` flag |
| heldBalance drift | Derive from orders + ledger, not separate column |
| Complaint + auto-complete race | Cek komplain aktif sebelum release (existing spec) |

---

## Definition of done

- [ ] Checkout tidak lagi kredit teknisi
- [ ] COMPLETED mengkredit teknisi neto
- [ ] Cart menampilkan fee pembeli
- [ ] Admin bisa set buyer/seller fee % di Settings
- [ ] Pembatalan penjual wajib alasan
- [ ] Saldo pembeli menampilkan breakdown escrow
- [ ] FT-ESC tests pass
