import type { Prisma } from '@prisma/client'
import { trackShipment, BinderbyteError } from '@/lib/binderbyte-client'
import { validateFreshShipmentRegistration } from '@/lib/shipment-registration'
import { isTerminalTrackingStatus, SHIPPING_COURIER_OPTIONS } from '@/lib/shipping-courier'
import type { ShippingCourier } from '@prisma/client'
import { computeNextTrackingSyncAt } from '@/lib/order-tracking-sync'

const MAX_SYNC_FAILURES = 5

function parseBinderbyteDate(value: string): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function courierLabel(code: ShippingCourier): string {
  return SHIPPING_COURIER_OPTIONS.find((o) => o.value === code)?.label ?? code
}

type SyncInput = {
  rekberId: string
  courier: ShippingCourier
  trackingNumber: string
  markShipped?: boolean
}

export async function syncRekberTrackingFromBinderbyte(
  input: SyncInput,
): Promise<{ newEvents: number; result: Awaited<ReturnType<typeof trackShipment>> }> {
  const { prisma } = await import('@/lib/db')
  const awb = input.trackingNumber.trim().replace(/\s+/g, '')

  let trackResult: Awaited<ReturnType<typeof trackShipment>>
  try {
    trackResult = await trackShipment(input.courier, awb)
  } catch (e) {
    if (e instanceof BinderbyteError) {
      await prisma.rekberTransaction.update({
        where: { id: input.rekberId },
        data: {
          trackingSyncFailures: { increment: 1 },
          trackingLastSyncedAt: new Date(),
          trackingNextSyncAt: computeNextTrackingSyncAt(new Date(), new Date()),
        },
      })
      const rekber = await prisma.rekberTransaction.findUnique({
        where: { id: input.rekberId },
        select: { trackingSyncFailures: true },
      })
      if ((rekber?.trackingSyncFailures ?? 0) >= MAX_SYNC_FAILURES) {
        await prisma.rekberTransaction.update({
          where: { id: input.rekberId },
          data: { trackingActive: false },
        })
      }
    }
    throw e
  }

  if (input.markShipped) {
    validateFreshShipmentRegistration(trackResult)
  }

  const now = new Date()
  const latestHistory = trackResult.history[0]
  const lastEventAt =
    parseBinderbyteDate(latestHistory?.date ?? '') ??
    parseBinderbyteDate(trackResult.date ?? '') ??
    now

  const terminal = isTerminalTrackingStatus(trackResult.status)
  const existing = await prisma.rekberTransaction.findUnique({
    where: { id: input.rekberId },
    select: { shippedAt: true },
  })
  const shippedAt = input.markShipped ? now : undefined
  const referenceForSchedule = shippedAt ?? existing?.shippedAt ?? now

  await prisma.$transaction(async (tx) => {
    const update: Prisma.RekberTransactionUpdateInput = {
      shippingCourier: input.courier,
      trackingNumber: awb,
      trackingSummaryStatus: trackResult.status,
      trackingSummaryDesc: trackResult.desc || latestHistory?.desc || null,
      trackingLastEventAt: lastEventAt,
      trackingLastSyncedAt: now,
      trackingNextSyncAt: terminal ? null : computeNextTrackingSyncAt(referenceForSchedule, now),
      trackingActive: !terminal,
      trackingSyncFailures: 0,
    }

    if (input.markShipped) {
      update.status = 'SHIPPED'
      update.shippedAt = shippedAt
    }

    await tx.rekberTransaction.update({
      where: { id: input.rekberId },
      data: update,
    })
  })

  return { newEvents: 0, result: trackResult }
}

export type RekberTrackingDto = {
  courier: ShippingCourier | null
  courierLabel: string | null
  trackingNumber: string | null
  summaryStatus: string | null
  summaryDesc: string | null
  lastEventAt: string | null
  lastSyncedAt: string | null
  trackingActive: boolean
}

export async function loadRekberTracking(rekberId: string): Promise<RekberTrackingDto | null> {
  const { prisma } = await import('@/lib/db')

  const row = await prisma.rekberTransaction.findUnique({
    where: { id: rekberId },
    select: {
      shippingCourier: true,
      trackingNumber: true,
      trackingSummaryStatus: true,
      trackingSummaryDesc: true,
      trackingLastEventAt: true,
      trackingLastSyncedAt: true,
      trackingActive: true,
    },
  })

  if (!row?.trackingNumber) return null

  return {
    courier: row.shippingCourier,
    courierLabel: row.shippingCourier ? courierLabel(row.shippingCourier) : null,
    trackingNumber: row.trackingNumber,
    summaryStatus: row.trackingSummaryStatus,
    summaryDesc: row.trackingSummaryDesc,
    lastEventAt: row.trackingLastEventAt?.toISOString() ?? null,
    lastSyncedAt: row.trackingLastSyncedAt?.toISOString() ?? null,
    trackingActive: row.trackingActive,
  }
}
