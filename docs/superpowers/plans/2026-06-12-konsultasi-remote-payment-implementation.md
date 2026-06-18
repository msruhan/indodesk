# Konsultasi + Remote + Payment — Implementation Plan

**Goal:** Integrasikan konsultasi dengan remote IndoDesk dan pembayaran upfront (wallet hold / PG stub) sesuai spec `docs/superpowers/specs/2026-06-12-konsultasi-remote-payment-design.md`.

**Reference:** `docs/superpowers/specs/2026-06-12-konsultasi-remote-payment-design.md`

---

## Phase 1: Schema & wallet hold

- [ ] **1.1** Prisma: enum + field `KonsultasiSession`, migration SQL + backfill legacy
- [ ] **1.2** `konsultasi-wallet.ts`: hold, release, finalize (legacy-aware)
- [ ] **1.3** Update `POST /api/user/konsultasi` — hold vs PG path
- [ ] **1.4** Update teknisi/user PATCH — payment guards + smart refund/capture
- [ ] **1.5** PG stub (`src/lib/payment-gateway/` + confirm endpoint)

## Phase 2: Profile & UI

- [ ] **2.1** `requiresRemote` di `ProfileConsultationService` + parse/normalize + API schema
- [ ] **2.2** `ConsultationServicesEditor` toggle remote
- [ ] **2.3** `konsultasi-booking-dialog.tsx` — device, OS, remote, payment UX
- [ ] **2.4** Serializers + status labels (`awaiting_payment`)
- [ ] **2.5** Teknisi konsultasi list — tampilkan remote info, filter SECURED

## Phase 3: Cleanup

- [ ] **3.1** Deprecate `POST /api/remote` (410)
- [ ] **3.2** Update functional test helpers
- [ ] **3.3** Copy/UI strings konsisten (hold vs bayar)

---

## Task detail — Phase 1.1 Schema

**Files:** `prisma/schema.prisma`, `prisma/migrations/20260612120000_konsultasi_payment_remote/migration.sql`

Add enums, extend `KonsultasiSession`, add `AWAITING_PAYMENT` to `KonsultasiStatus`.

Backfill SQL:

```sql
UPDATE "KonsultasiSession"
SET "paymentStatus" = 'CAPTURED', "paymentMethod" = 'LEGACY_DEBIT'
WHERE status = 'COMPLETED';

UPDATE "KonsultasiSession"
SET "paymentStatus" = 'SECURED', "paymentMethod" = 'LEGACY_DEBIT'
WHERE status IN ('PENDING', 'ACTIVE');
```

Run: `npx prisma migrate deploy` or `npm run db:push` per project convention.

---

## Task detail — Phase 1.2 Wallet

**Files:** `src/lib/konsultasi-wallet.ts`

- `holdUserForKonsultasi` → `ESCROW_HOLD`, set `HELD`/`SECURED`
- `releaseKonsultasiHoldToUser` → credit back + `RELEASED`
- `finalizeKonsultasiPaymentToTeknisi` → check ledger idempotency, credit teknisi, `CAPTURED`
- `refundKonsultasiPayment` → hold release OR legacy `REFUND` OR PG stub refund

---

## Task detail — Phase 1.3 Booking API

**Files:** `src/app/api/user/konsultasi/route.ts`

Extend `createSchema`:

```typescript
device: z.string().min(1).max(120)
clientOs: z.enum(['WINDOWS', 'MACOS'])
remoteId: z.string().max(32).optional()
remoteOtp: z.string().max(32).optional()
```

Flow:

1. Validate service + `requiresRemote` → require remoteId
2. Check wallet balance
3. Sufficient → transaction: create session + hold → `PENDING`/`SECURED`
4. Insufficient → create `AWAITING_PAYMENT`/`UNPAID` + PG create → return `needsPayment`

---

## Verification

```bash
cd indoteknizi && npx tsc --noEmit
npm run build
```

Manual: book konsultasi as siti@gmail.com with/without saldo; teknisi start only when SECURED.
