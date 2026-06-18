import type { Prisma } from '@prisma/client'
import { trackShipment, BinderbyteError } from '@/lib/binderbyte-client'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'
import {
  computeNextTrackingSyncAt,
  extractTrackingLocationFromText,
} from '@/lib/order-tracking-sync'
import { computeSellerConfirmDeadline } from '@/lib/marketplace-return-deadlines'
import type { ShippingCourier } from '@prisma/client'

const MAX_SYNC_FAILURES = 5
const MAX_TRACKING_DAYS = 14

function parseBinderbyteDate(value: string): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

export type ReturnTrackingDto = {
  courier: ShippingCourier | null
  trackingNumber: string | null
  summaryStatus: string | null
  lastSyncedAt: string | null
  trackingActive: boolean
  events: Array<{
    id: string
    occurredAt: string
    description: string
    location: string | null
  }>
}

export async function loadReturnTracking(complaintId: string): Promise<ReturnTrackingDto | null> {
  const { prisma } = await import('@/lib/db')

  const complaint = await prisma.orderComplaint.findUnique({
    where: { id: complaintId },
    select: {
      returnCourier: true,
      returnTrackingNumber: true,
      returnSummaryStatus: true,
      returnLastSyncedAt: true,
      returnTrackingActive: true,
      returnTrackingEvents: {
        orderBy: { occurredAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!complaint?.returnTrackingNumber) return null

  return {
    courier: complaint.returnCourier,
    trackingNumber: complaint.returnTrackingNumber,
    summaryStatus: complaint.returnSummaryStatus,
    lastSyncedAt: complaint.returnLastSyncedAt?.toISOString() ?? null,
    trackingActive: complaint.returnTrackingActive,
    events: complaint.returnTrackingEvents.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt.toISOString(),
      description: e.description,
      location: e.location,
    })),
  }
}

type SyncInput = {
  complaintId: string
  courier: ShippingCourier
  trackingNumber: string
}

export async function syncReturnTrackingFromBinderbyte(
  input: SyncInput,
): Promise<{ newEvents: number; result: Awaited<ReturnType<typeof trackShipment>> }> {
  const { prisma } = await import('@/lib/db')
  const awb = input.trackingNumber.trim().replace(/\s+/g, '')

  let trackResult: Awaited<ReturnType<typeof trackShipment>>
  try {
    trackResult = await trackShipment(input.courier, awb)
  } catch (e) {
    if (e instanceof BinderbyteError) {
      await prisma.orderComplaint.update({
        where: { id: input.complaintId },
        data: {
          returnSyncFailures: { increment: 1 },
          returnLastSyncedAt: new Date(),
          returnNextSyncAt: computeNextTrackingSyncAt(new Date(), new Date()),
        },
      })
      const complaint = await prisma.orderComplaint.findUnique({
        where: { id: input.complaintId },
        select: { returnSyncFailures: true },
      })
      if ((complaint?.returnSyncFailures ?? 0) >= MAX_SYNC_FAILURES) {
        await prisma.orderComplaint.update({
          where: { id: input.complaintId },
          data: { returnTrackingActive: false },
        })
      }
    }
    throw e
  }

  const now = new Date()
  const latestHistory = trackResult.history[0]
  const lastEventAt =
    parseBinderbyteDate(latestHistory?.date ?? '') ??
    parseBinderbyteDate(trackResult.date ?? '') ??
    now

  const terminal = isTerminalTrackingStatus(trackResult.status)
  const existingComplaint = await prisma.orderComplaint.findUnique({
    where: { id: input.complaintId },
    select: { returnShippedAt: true, status: true },
  })
  const referenceForSchedule = existingComplaint?.returnShippedAt ?? now

  let createdCount = 0
  await prisma.$transaction(async (tx) => {
    const existing = await tx.orderReturnTrackingEvent.findMany({
      where: { complaintId: input.complaintId },
      select: { occurredAt: true, description: true },
    })
    const existingKeys = new Set(
      existing.map((e) => `${e.occurredAt.toISOString()}|${e.description}`),
    )

    const toCreate: Prisma.OrderReturnTrackingEventCreateManyInput[] = []
    for (const h of trackResult.history) {
      const occurredAt = parseBinderbyteDate(h.date) ?? now
      const description = h.desc?.trim() || 'Update pengiriman retur'
      const key = `${occurredAt.toISOString()}|${description}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      toCreate.push({
        complaintId: input.complaintId,
        occurredAt,
        description,
        location: extractTrackingLocationFromText(description, h.location),
      })
    }

    if (toCreate.length > 0) {
      const created = await tx.orderReturnTrackingEvent.createMany({ data: toCreate })
      createdCount = created.count
    }

    const complaintUpdate: Prisma.OrderComplaintUpdateInput = {
      returnCourier: input.courier,
      returnTrackingNumber: awb,
      returnSummaryStatus: trackResult.status,
      returnLastSyncedAt: now,
      returnNextSyncAt: terminal ? null : computeNextTrackingSyncAt(referenceForSchedule, now),
      returnTrackingActive: !terminal,
      returnSyncFailures: 0,
    }

    if (terminal && existingComplaint?.status === 'RETURN_SHIPPED') {
      complaintUpdate.status = 'AWAITING_SELLER_CONFIRM'
      complaintUpdate.returnDeliveredAt = lastEventAt
      complaintUpdate.sellerConfirmDeadline = computeSellerConfirmDeadline(lastEventAt)
    }

    await tx.orderComplaint.update({
      where: { id: input.complaintId },
      data: complaintUpdate,
    })
  })

  return { newEvents: createdCount, result: trackResult }
}

export async function refreshReturnTracking(complaintId: string): Promise<void> {
  const { prisma } = await import('@/lib/db')
  const complaint = await prisma.orderComplaint.findUnique({
    where: { id: complaintId },
    select: {
      id: true,
      returnCourier: true,
      returnTrackingNumber: true,
      returnShippedAt: true,
      status: true,
      returnTrackingActive: true,
    },
  })

  if (!complaint?.returnCourier || !complaint.returnTrackingNumber) {
    throw new BinderbyteError('Retur belum memiliki data pengiriman', 'INVALID_AWB')
  }

  if (!complaint.returnTrackingActive && complaint.status !== 'RETURN_SHIPPED') {
    return
  }

  const ageMs = complaint.returnShippedAt
    ? Date.now() - complaint.returnShippedAt.getTime()
    : 0
  if (complaint.returnShippedAt && ageMs > MAX_TRACKING_DAYS * 24 * 60 * 60 * 1000) {
    await prisma.orderComplaint.update({
      where: { id: complaintId },
      data: { returnTrackingActive: false, returnNextSyncAt: null },
    })
    return
  }

  await syncReturnTrackingFromBinderbyte({
    complaintId: complaint.id,
    courier: complaint.returnCourier,
    trackingNumber: complaint.returnTrackingNumber,
  })
}
