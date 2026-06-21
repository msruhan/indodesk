import type { Prisma } from '@prisma/client'
import { trackShipment, BinderbyteError } from '@/lib/binderbyte-client'
import { validateFreshShipmentRegistration } from '@/lib/shipment-registration'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'
import type { ShippingCourier } from '@prisma/client'

const MAX_SYNC_FAILURES = 5
const MAX_TRACKING_DAYS = 14

/** Interval poll adaptif berdasarkan umur pengiriman */
export function computeNextTrackingSyncAt(from: Date, reference: Date = new Date()): Date {
  const ageMs = reference.getTime() - from.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  let hours = 12
  if (ageDays < 2) hours = 3
  else if (ageDays < 7) hours = 6

  return new Date(reference.getTime() + hours * 60 * 60 * 1000)
}

function parseBinderbyteDate(value: string): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

/** BinderByte/JNT sering mengosongkan field location — ambil dari deskripsi jika perlu */
export function extractTrackingLocationFromText(
  description: string,
  location?: string | null,
): string | null {
  const direct = location?.trim()
  if (direct) return direct

  const desc = description.trim()
  if (!desc) return null

  const patterns = [
    /(?:sampai di|dikirimkan ke|diterima oleh|menuju ke?|ke)\s+([A-Z0-9_]+)/i,
    /\b([A-Z]{2,}_[A-Z0-9_]+)\b/,
  ]
  for (const pattern of patterns) {
    const match = desc.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

export type OrderTrackingDto = {
  courier: ShippingCourier | null
  trackingNumber: string | null
  summaryStatus: string | null
  summaryDesc: string | null
  lastEventAt: string | null
  lastSyncedAt: string | null
  trackingActive: boolean
  events: Array<{
    id: string
    occurredAt: string
    description: string
    location: string | null
  }>
}

export async function loadOrderTracking(orderId: string): Promise<OrderTrackingDto | null> {
  const { prisma } = await import('@/lib/db')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      shippingCourier: true,
      trackingNumber: true,
      trackingSummaryStatus: true,
      trackingSummaryDesc: true,
      trackingLastEventAt: true,
      trackingLastSyncedAt: true,
      trackingActive: true,
      trackingEvents: {
        orderBy: { occurredAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!order?.trackingNumber) return null

  return {
    courier: order.shippingCourier,
    trackingNumber: order.trackingNumber,
    summaryStatus: order.trackingSummaryStatus,
    summaryDesc: order.trackingSummaryDesc,
    lastEventAt: order.trackingLastEventAt?.toISOString() ?? null,
    lastSyncedAt: order.trackingLastSyncedAt?.toISOString() ?? null,
    trackingActive: order.trackingActive,
    events: order.trackingEvents.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt.toISOString(),
      description: e.description,
      location: e.location,
    })),
  }
}

type SyncInput = {
  orderId: string
  courier: ShippingCourier
  trackingNumber: string
  /** Set status SHIPPED + shippedAt on first submit */
  markShipped?: boolean
}

/**
 * Panggil BinderByte, simpan event baru, update field tracking order.
 * Mengembalikan jumlah event baru.
 */
export async function syncOrderTrackingFromBinderbyte(
  input: SyncInput,
): Promise<{ newEvents: number; result: Awaited<ReturnType<typeof trackShipment>> }> {
  const { prisma } = await import('@/lib/db')
  const awb = input.trackingNumber.trim().replace(/\s+/g, '')

  let trackResult: Awaited<ReturnType<typeof trackShipment>>
  try {
    trackResult = await trackShipment(input.courier, awb)
  } catch (e) {
    if (e instanceof BinderbyteError) {
      await prisma.order.update({
        where: { id: input.orderId },
        data: {
          trackingSyncFailures: { increment: 1 },
          trackingLastSyncedAt: new Date(),
          trackingNextSyncAt: computeNextTrackingSyncAt(new Date(), new Date()),
        },
      })
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        select: { trackingSyncFailures: true },
      })
      if ((order?.trackingSyncFailures ?? 0) >= MAX_SYNC_FAILURES) {
        await prisma.order.update({
          where: { id: input.orderId },
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
  const existingOrder = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { shippedAt: true },
  })
  const shippedAt = input.markShipped ? now : undefined
  const referenceForSchedule = shippedAt ?? existingOrder?.shippedAt ?? now

  let createdCount = 0
  await prisma.$transaction(async (tx) => {
    const existing = await tx.orderTrackingEvent.findMany({
      where: { orderId: input.orderId },
      select: { occurredAt: true, description: true },
    })
    const existingKeys = new Set(
      existing.map((e) => `${e.occurredAt.toISOString()}|${e.description}`),
    )

    const toCreate: Prisma.OrderTrackingEventCreateManyInput[] = []
    for (const h of trackResult.history) {
      const occurredAt = parseBinderbyteDate(h.date) ?? now
      const description = h.desc?.trim() || 'Update pengiriman'
      const key = `${occurredAt.toISOString()}|${description}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      toCreate.push({
        orderId: input.orderId,
        occurredAt,
        description,
        location: extractTrackingLocationFromText(description, h.location),
      })
    }

    if (toCreate.length > 0) {
      const created = await tx.orderTrackingEvent.createMany({ data: toCreate })
      createdCount = created.count
    }

    const orderUpdate: Prisma.OrderUpdateInput = {
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
      orderUpdate.status = 'SHIPPED'
      orderUpdate.shippedAt = shippedAt
    }

    await tx.order.update({
      where: { id: input.orderId },
      data: orderUpdate,
    })
  })

  if (isTerminalTrackingStatus(trackResult.status)) {
    const { markOrderDelivered } = await import('@/lib/marketplace-order-deadlines')
    await markOrderDelivered(input.orderId)
  }

  return { newEvents: createdCount, result: trackResult }
}

/** Poll order yang sudah punya resi (tanpa ubah status) */
export async function refreshOrderTracking(orderId: string): Promise<void> {
  const { prisma } = await import('@/lib/db')
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      shippingCourier: true,
      trackingNumber: true,
      shippedAt: true,
      status: true,
      trackingActive: true,
    },
  })

  if (!order?.shippingCourier || !order.trackingNumber) {
    throw new BinderbyteError('Order belum memiliki data pengiriman', 'INVALID_AWB')
  }

  if (!order.trackingActive && order.status === 'COMPLETED') {
    return
  }

  const ageMs = order.shippedAt
    ? Date.now() - order.shippedAt.getTime()
    : 0
  if (order.shippedAt && ageMs > MAX_TRACKING_DAYS * 24 * 60 * 60 * 1000) {
    await prisma.order.update({
      where: { id: orderId },
      data: { trackingActive: false, trackingNextSyncAt: null },
    })
    return
  }

  await syncOrderTrackingFromBinderbyte({
    orderId: order.id,
    courier: order.shippingCourier,
    trackingNumber: order.trackingNumber,
    markShipped: false,
  })
}
