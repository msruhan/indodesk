import { prisma } from '@/lib/db'
import { completeMarketplaceOrder } from '@/lib/marketplace-order-confirm'
import { expireCancellationRequests } from '@/lib/marketplace-order-cancellation'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'
import { ACTIVE_COMPLAINT_STATUSES } from '@/lib/marketplace-return-deadlines'

export const BUYER_ACTION_DAYS = 3
export const SELLER_RESPONSE_DAYS = 2
export const BUYER_ESCALATION_DAYS = 2

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY)
}

export async function markOrderDelivered(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, deliveredAt: true, trackingSummaryStatus: true },
  })
  if (!order || order.deliveredAt) return false
  if (order.status !== 'SHIPPED') return false
  if (!isTerminalTrackingStatus(order.trackingSummaryStatus)) return false

  const now = new Date()
  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveredAt: now,
      buyerActionDeadline: addDays(now, BUYER_ACTION_DAYS),
    },
  })
  return true
}

export async function backfillDeliveredFromTracking(batchSize = 50): Promise<number> {
  const orders = await prisma.order.findMany({
    where: {
      status: 'SHIPPED',
      deliveredAt: null,
      trackingSummaryStatus: { not: null },
    },
    take: batchSize,
    select: { id: true, trackingSummaryStatus: true },
  })

  let count = 0
  for (const order of orders) {
    if (!isTerminalTrackingStatus(order.trackingSummaryStatus)) continue
    const marked = await markOrderDelivered(order.id)
    if (marked) count += 1
  }
  return count
}

export async function processAutoCompletions(batchSize = 30): Promise<number> {
  const now = new Date()
  const orders = await prisma.order.findMany({
    where: {
      status: 'SHIPPED',
      buyerActionDeadline: { lt: now },
      complaint: null,
    },
    take: batchSize,
    select: { id: true },
  })

  let count = 0
  for (const { id } of orders) {
    const hasActiveComplaint = await prisma.orderComplaint.findFirst({
      where: {
        orderId: id,
        status: { in: [...ACTIVE_COMPLAINT_STATUSES] },
      },
    })
    if (hasActiveComplaint) continue

    try {
      await completeMarketplaceOrder(id, { auto: true })
      count += 1
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_STATUS') continue
      throw e
    }
  }
  return count
}

export async function processComplaintEscalations(batchSize = 30): Promise<number> {
  const now = new Date()
  let count = 0

  // Legacy: SELLER_RESPONDED complaints (pre-RMA) still eligible for buyer escalation window
  const sellerRespondedCutoff = addDays(now, -BUYER_ESCALATION_DAYS)
  const buyerSilent = await prisma.orderComplaint.findMany({
    where: {
      status: 'SELLER_RESPONDED',
      sellerRespondedAt: { lt: sellerRespondedCutoff },
      escalatedAt: null,
    },
    take: batchSize,
    select: { id: true },
  })
  for (const row of buyerSilent) {
    await prisma.orderComplaint.update({
      where: { id: row.id },
      data: { status: 'ESCALATED', escalatedAt: now },
    })
    count += 1
  }

  return count
}

export async function processMarketplaceOrderDeadlines() {
  const backfilled = await backfillDeliveredFromTracking()
  const autoCompleted = await processAutoCompletions()
  const escalated = await processComplaintEscalations()
  const expiredCancelRequests = await expireCancellationRequests()
  return { backfilled, autoCompleted, escalated, expiredCancelRequests }
}
