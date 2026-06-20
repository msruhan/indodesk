# Konsultasi User Confirm Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Payout konsultasi hanya setelah user konfirmasi selesai atau auto-complete 48 jam setelah teknisi menandai layanan selesai.

**Architecture:** Tambah status `AWAITING_CONFIRMATION` + deadline fields; ekstrak `completeKonsultasiSession()` idempotent untuk user confirm & cron; ganti action teknisi `complete` → `mark-done` tanpa payout; notifikasi in-app computed dari DB (pola `user-rating-prompt-notifications`).

**Tech Stack:** Next.js App Router, Prisma, Zod, existing `finalizeKonsultasiPaymentToTeknisi`, cron + `validateCronSecret`.

**Reference:** `docs/superpowers/specs/2026-06-20-konsultasi-user-confirm-completion-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | Enum + fields + index |
| `src/lib/konsultasi-completion.ts` | `KONSULTASI_CONFIRM_TIMEOUT_HOURS`, `computeConfirmDeadline`, `processKonsultasiConfirmDeadlines` |
| `src/lib/konsultasi-complete.ts` | `completeKonsultasiSession` (payout idempotent) |
| `src/lib/konsultasi-complete.test.ts` | Unit tests deadline + idempotency |
| `src/app/api/teknisi/konsultasi/[id]/route.ts` | `mark-done`, remove `complete` |
| `src/app/api/user/konsultasi/[id]/route.ts` | `confirm-complete` |
| `src/app/api/cron/konsultasi-confirm-deadlines/route.ts` | Cron entry |
| `src/lib/teknisi-layanan-serializer.ts` | UI status + DTO fields |
| `src/lib/user-konsultasi-serializer.ts` | `canConfirmComplete`, deadline fields |
| `src/lib/user-konsultasi-confirm-notifications.ts` | In-app notif user: perlu konfirmasi |
| `src/lib/teknisi-service-notifications.ts` | Extend: sesi menunggu konfirmasi user |
| `src/app/teknisi/konsultasi/page.tsx` | UI mark-done + awaiting state |
| `src/app/user/konsultasi/page.tsx` | UI confirm-complete + countdown |
| `src/app/api/admin/monitoring/**` | Label AWAITING_CONFIRMATION |
| `src/lib/admin-monitoring-notifications.ts` | Badge tone for new status |
| `src/lib/user-dashboard-data.ts` | Count ACTIVE + AWAITING_CONFIRMATION as active |
| `src/lib/teknisi-dashboard-data.ts` | Same |
| `docs/functional-tests/05-konsultasi.md` | Update FT-KON-004* |

---

## Phase 1: Schema & constants

- [ ] **1.1** Edit `prisma/schema.prisma`:
  - Add `AWAITING_CONFIRMATION` to `KonsultasiStatus` (after `ACTIVE`)
  - Add to `KonsultasiSession`: `teknisiMarkedDoneAt DateTime?`, `confirmDeadlineAt DateTime?`
  - Add `@@index([status, confirmDeadlineAt])`
- [ ] **1.2** Run migration:
  ```bash
  cd indoteknizi && npx prisma migrate dev --name konsultasi_awaiting_confirmation
  npx prisma generate
  ```
- [ ] **1.3** Create `src/lib/konsultasi-completion.ts`:

```ts
export const KONSULTASI_CONFIRM_TIMEOUT_HOURS = 48

export function computeConfirmDeadline(from: Date): Date {
  return new Date(from.getTime() + KONSULTASI_CONFIRM_TIMEOUT_HOURS * 60 * 60 * 1000)
}
```

- [ ] **1.4** Create failing test `src/lib/konsultasi-completion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computeConfirmDeadline, KONSULTASI_CONFIRM_TIMEOUT_HOURS } from './konsultasi-completion'

describe('computeConfirmDeadline', () => {
  it('adds 48 hours', () => {
    const from = new Date('2026-06-20T10:00:00Z')
    const deadline = computeConfirmDeadline(from)
    expect(deadline.getTime() - from.getTime()).toBe(KONSULTASI_CONFIRM_TIMEOUT_HOURS * 3600_000)
  })
})
```

- [ ] **1.5** Run: `npm test -- src/lib/konsultasi-completion.test.ts` → PASS
- [ ] **1.6** Commit: `feat(konsultasi): schema awaiting confirmation + deadline helpers`

---

## Phase 2: Shared completion helper

- [ ] **2.1** Create `src/lib/konsultasi-complete.ts` — move payout logic from teknisi route:

```ts
import type { KonsultasiSession, Prisma } from '@prisma/client'
import { logCommunicationEvent, logPaymentEvent } from '@/lib/activity-log'
import { finalizeKonsultasiPaymentToTeknisi } from '@/lib/konsultasi-wallet'

type Tx = Prisma.TransactionClient
type Source = 'user' | 'auto_timeout'

export async function completeKonsultasiSession(
  tx: Tx,
  existing: KonsultasiSession,
  opts: { source: Source; actorUserId?: string },
): Promise<KonsultasiSession> {
  if (existing.status === 'COMPLETED') return existing
  if (existing.status !== 'AWAITING_CONFIRMATION') {
    throw new Error('INVALID_STATUS')
  }

  const now = new Date()
  const row = await tx.konsultasiSession.update({
    where: { id: existing.id },
    data: {
      status: 'COMPLETED',
      endedAt: now,
      remoteOtp: null,
      paymentStatus: 'CAPTURED',
    },
  })

  await finalizeKonsultasiPaymentToTeknisi(
    tx,
    existing.teknisiId,
    existing.userId,
    existing.price,
    existing.id,
    existing.service,
    existing.paymentMethod,
  )

  return row
}

export async function finalizeKonsultasiCompletionSideEffects(
  session: KonsultasiSession,
  opts: { source: Source; actorName?: string; actorEmail?: string | null },
) {
  const { syncTeknisiCompletedSessions } = await import('@/lib/teknisi-stats-server')
  await syncTeknisiCompletedSessions(session.teknisiId)

  const actor = opts.source === 'user'
    ? { id: session.userId, name: opts.actorName ?? 'User', email: opts.actorEmail ?? null, role: 'USER' as const }
    : { id: 'system', name: 'Sistem', email: null, role: 'ADMIN' as const }

  void logPaymentEvent({ /* konsultasi.earning — mirror teknisi route */ })
  void logCommunicationEvent({ /* konsultasi.completed */ })
}
```

- [ ] **2.2** Add idempotency test in `src/lib/konsultasi-complete.test.ts` (mock prisma tx or integration-style with test DB if project pattern exists; minimum: test `INVALID_STATUS` throw)
- [ ] **2.3** Commit: `feat(konsultasi): shared completeKonsultasiSession helper`

---

## Phase 3: API — teknisi mark-done

- [ ] **3.1** Modify `src/app/api/teknisi/konsultasi/[id]/route.ts`:
  - Change Zod: `z.enum(['start', 'mark-done', 'cancel'])` — remove `complete`
  - Replace `case 'complete'` with `case 'mark-done'`:

```ts
case 'mark-done':
  if (existing.status !== 'ACTIVE') {
    return apiError('Hanya konsultasi berjalan yang bisa ditandai selesai')
  }
  if (existing.paymentStatus !== 'SECURED') {
    return apiError('Pembayaran belum dikonfirmasi')
  }
  const markedAt = new Date()
  data = {
    status: 'AWAITING_CONFIRMATION',
    remoteOtp: null,
    teknisiMarkedDoneAt: markedAt,
    confirmDeadlineAt: computeConfirmDeadline(markedAt),
  }
  break
```

  - Remove `finalizeKonsultasiPaymentToTeknisi` block from teknisi route entirely
  - Log: `konsultasi.marked_done` (new action) instead of completed/earning

- [ ] **3.2** Update `serializeTeknisiKonsultasi` in `teknisi-layanan-serializer.ts`:
  - Add `'awaiting_confirmation'` to `TeknisiKonsultasiStatus`
  - Map `AWAITING_CONFIRMATION` in `mapKonsultasiUiStatus`
  - Label: `'Menunggu user'` in `konsultasiStatusLabel`
  - Add fields: `teknisiMarkedDoneAt`, `confirmDeadlineAt`, `canMarkDone: session.status === 'ACTIVE'`
  - Update `remoteOtp` visibility: include `AWAITING_CONFIRMATION` if needed (hide OTP — already null after mark-done)

- [ ] **3.3** Commit: `feat(konsultasi): teknisi mark-done without payout`

---

## Phase 4: API — user confirm-complete

- [ ] **4.1** Extend `patchSchema` in `src/app/api/user/konsultasi/[id]/route.ts`:

```ts
z.object({ action: z.literal('confirm-complete') }),
```

- [ ] **4.2** Handler before rate block:

```ts
if (parsed.data.action === 'confirm-complete') {
  if (existing.status !== 'AWAITING_CONFIRMATION') {
    return apiError('Konsultasi belum menunggu konfirmasi')
  }
  const updated = await walletTransaction(async (tx) =>
    completeKonsultasiSession(tx, existing, { source: 'user', actorUserId: session.user.id }),
  )
  await finalizeKonsultasiCompletionSideEffects(updated, {
    source: 'user',
    actorName: session.user.name,
    actorEmail: session.user.email,
  })
  return apiSuccess(serializeUserKonsultasi(/* re-fetch with teknisi include */))
}
```

- [ ] **4.3** Update `user-konsultasi-serializer.ts`:
  - `canConfirmComplete: session.status === 'AWAITING_CONFIRMATION'`
  - `confirmDeadlineAt: session.confirmDeadlineAt?.toISOString() ?? null`
  - Map status label `'Menunggu konfirmasi'`

- [ ] **4.4** Commit: `feat(konsultasi): user confirm-complete triggers payout`

---

## Phase 5: Cron auto-complete

- [ ] **5.1** Add to `src/lib/konsultasi-completion.ts`:

```ts
export async function processKonsultasiConfirmDeadlines(batchSize = 50) {
  const now = new Date()
  const rows = await prisma.konsultasiSession.findMany({
    where: { status: 'AWAITING_CONFIRMATION', confirmDeadlineAt: { lte: now } },
    take: batchSize,
  })
  let processed = 0
  let errors = 0
  for (const row of rows) {
    try {
      await walletTransaction(async (tx) =>
        completeKonsultasiSession(tx, row, { source: 'auto_timeout' }),
      )
      await finalizeKonsultasiCompletionSideEffects(row, { source: 'auto_timeout' })
      processed++
    } catch {
      errors++
    }
  }
  return { processed, errors, scanned: rows.length }
}
```

- [ ] **5.2** Create `src/app/api/cron/konsultasi-confirm-deadlines/route.ts` (mirror `marketplace-order-deadlines/route.ts`)
- [ ] **5.3** Document VPS cron in comment at top of route (every 15 min):
  `curl -H "Authorization: Bearer $CRON_SECRET" https://bantoo.in/api/cron/konsultasi-confirm-deadlines`
- [ ] **5.4** Commit: `feat(konsultasi): cron auto-complete after 48h deadline`

---

## Phase 6: UI teknisi

- [ ] **6.1** `src/app/teknisi/konsultasi/page.tsx`:
  - Change `patchAction` type: `'start' | 'mark-done' | 'cancel'`
  - Replace `complete` button with `mark-done` + `useConfirm()` dialog copy from spec
  - For `awaiting_confirmation`: show badge + deadline text, hide action buttons except Chat
  - Update `statusBadgeVariant` for `awaiting_confirmation` → `warning`
  - Include `awaiting_confirmation` in tab **Berjalan** filter OR add status tab (spec: show in Berjalan)

- [ ] **6.2** `konsultasi-detail-modal.tsx`: show deadline + status Menunggu user when applicable

- [ ] **6.3** Commit: `feat(konsultasi): teknisi UI mark-done and awaiting state`

---

## Phase 7: UI user

- [ ] **7.1** `src/app/user/konsultasi/page.tsx`:
  - Add `confirm-complete` to patch handler (mirror rate/cancel pattern)
  - Primary button **Konfirmasi selesai** when `k.canConfirmComplete`
  - `useConfirm()` dialog: *"Dana akan dicairkan ke teknisi. Pastikan layanan sudah sesuai."*
  - Show deadline: format `confirmDeadlineAt` with `Intl.DateTimeFormat('id-ID', ...)`

- [ ] **7.2** Update `statusBadgeVariant` / `statusConfig` for `awaiting_confirmation`

- [ ] **7.3** Commit: `feat(konsultasi): user confirm-complete UI`

---

## Phase 8: Notifications

- [ ] **8.1** Create `src/lib/user-konsultasi-confirm-notifications.ts`:

```ts
export async function fetchUserKonsultasiConfirmNotifications(userId: string) {
  const rows = await prisma.konsultasiSession.findMany({
    where: { userId, status: 'AWAITING_CONFIRMATION' },
    orderBy: { teknisiMarkedDoneAt: 'desc' },
    take: 10,
    include: { teknisi: { select: { name: true } } },
  })
  return rows.map((row) => ({
    id: `konsultasi-confirm-${row.id}`,
    title: 'Konfirmasi konsultasi selesai',
    body: `${row.teknisi.name} menandai layanan selesai — konfirmasi sebelum ${/* format deadline */}`,
    href: '/user/konsultasi',
    tone: 'warning',
    icon: 'message',
    audiences: ['USER'],
    active: true,
    kind: 'order',
    createdAt: row.teknisiMarkedDoneAt?.toISOString() ?? row.updatedAt.toISOString(),
  }))
}
```

- [ ] **8.2** Wire in `src/app/api/notifications/route.ts` for USER role (merge before sort)
- [ ] **8.3** Extend `teknisi-service-notifications.ts`: rows `AWAITING_CONFIRMATION` → "Menunggu konfirmasi user"
- [ ] **8.4** Commit: `feat(konsultasi): in-app confirm notifications`

---

## Phase 9: Admin monitoring & dashboards

- [ ] **9.1** `src/app/api/admin/monitoring/route.ts` + `[channel]/[id]/route.ts`:
  - Map `AWAITING_CONFIRMATION` badge: label "Menunggu konfirmasi", tone `warning`
  - Include `confirmDeadlineAt` in meta when loading konsultasi detail

- [ ] **9.2** `admin-monitoring-notifications.ts` — handle new status in `konsultasiStatusLabel`

- [ ] **9.3** `user-dashboard-data.ts` + `teknisi-dashboard-data.ts`:
  - Active count: `PENDING || ACTIVE || AWAITING_CONFIRMATION`

- [ ] **9.4** Commit: `feat(konsultasi): admin monitoring and dashboard counts for awaiting confirmation`

---

## Phase 10: Docs, tests, verification

- [ ] **10.1** Update `docs/functional-tests/05-konsultasi.md`:
  - FT-KON-004 → teknisi mark-done (no payout)
  - FT-KON-004b → user confirm-complete → wallet EARNING
  - FT-KON-004c → cron with mocked deadline

- [ ] **10.2** Grep cleanup — ensure no remaining teknisi `complete` action:
  ```bash
  rg "action.*complete" src/app/teknisi/konsultasi src/app/api/teknisi/konsultasi
  ```

- [ ] **10.3** Run:
  ```bash
  npm test
  npx tsc --noEmit
  ```

- [ ] **10.4** Manual E2E:
  1. User book + pay → teknisi Mulai
  2. Teknisi **Selesai melayani** → status Menunggu konfirmasi, teknisi wallet unchanged
  3. User **Konfirmasi selesai** → COMPLETED, teknisi wallet +EARNING
  4. (Optional) Set `confirmDeadlineAt` past in DB → run cron → auto-complete

- [ ] **10.5** Commit: `docs: update konsultasi completion functional tests`

---

## Spec coverage checklist

| Spec § | Task |
|--------|------|
| §3 State machine | Phases 3–5 |
| §4 Schema | Phase 1 |
| §5 Shared helper | Phase 2 |
| §6 API | Phases 3–5 |
| §7 Serializers | Phases 3–4 |
| §8 UI | Phases 6–7 |
| §9 Notifications | Phase 8 |
| §10 Edge cases | Phase 2 idempotency, Phase 5 transaction |
| §11 Testing | Phases 1–2, 10 |
| §12 Out of scope | Not planned |

---

## VPS deploy note (post-merge)

Add to server crontab (15 min):

```cron
*/15 * * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" https://bantoo.in/api/cron/konsultasi-confirm-deadlines >> /var/log/bantoo-cron.log 2>&1
```
