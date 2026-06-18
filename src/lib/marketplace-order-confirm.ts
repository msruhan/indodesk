import { prisma } from '@/lib/db'
import { logOrderEvent } from '@/lib/activity-log'
import type { ActivityActor } from '@/lib/activity-log'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { releaseEscrowOrderToSeller, ensureMarketplaceOrderSettlement } from '@/lib/marketplace-wallet'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

const ORDER_INCLUDE = {
  buyer: { select: PARTY_SELECT },
  seller: { select: PARTY_SELECT },
  items: { include: { product: { select: { id: true, name: true } } } },
  complaint: { include: { media: true } },
} as const

type CompleteOptions = {
  auto?: boolean
  actor?: ActivityActor
}

export async function completeMarketplaceOrder(orderId: string, options: CompleteOptions = {}) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  })

  if (!existing) {
    throw new Error('ORDER_NOT_FOUND')
  }
  if (existing.status !== 'SHIPPED') {
    throw new Error('INVALID_STATUS')
  }
  if (!isTerminalTrackingStatus(existing.trackingSummaryStatus)) {
    throw new Error('NOT_DELIVERED')
  }

  const activeComplaint = await prisma.orderComplaint.findFirst({
    where: {
      orderId,
      status: { in: ['OPEN', 'SELLER_RESPONDED', 'ESCALATED'] },
    },
  })
  if (activeComplaint) {
    throw new Error('COMPLAINT_ACTIVE')
  }

  const now = new Date()
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      completedAt: now,
      ...(options.auto ? { autoCompletedAt: now } : {}),
      trackingActive: false,
      trackingNextSyncAt: null,
    },
    include: ORDER_INCLUDE,
  })

  try {
    if (existing.settlementVersion === 2) {
      await releaseEscrowOrderToSeller(orderId)
    } else {
      await ensureMarketplaceOrderSettlement(orderId)
    }
  } catch (e) {
    if (!(e instanceof Error && e.message === 'INSUFFICIENT_BALANCE')) {
      throw e
    }
  }

  if (options.actor) {
    void logOrderEvent({
      action: options.auto ? 'marketplace.auto_completed' : 'marketplace.confirmed_receipt',
      severity: 'SUCCESS',
      summary: options.auto
        ? `Auto-selesai ${existing.orderCode} (batas 3 hari)`
        : `Pembeli konfirmasi terima ${existing.orderCode}`,
      actor: options.actor,
      target: { type: 'marketplace_order', id: orderId, label: existing.orderCode },
    })
  }

  return updated
}

export async function confirmMarketplaceOrderReceipt(
  orderId: string,
  buyerId: string,
  actor: ActivityActor,
) {
  const existing = await prisma.order.findFirst({
    where: { id: orderId, buyerId },
    select: { id: true, buyerActionDeadline: true, status: true },
  })

  if (!existing) {
    throw new Error('ORDER_NOT_FOUND')
  }
  if (existing.buyerActionDeadline && existing.buyerActionDeadline < new Date()) {
    throw new Error('DEADLINE_PASSED')
  }

  const updated = await completeMarketplaceOrder(orderId, { actor })

  return serializeMarketplaceOrder(updated, {
    viewerId: buyerId,
    viewerRole: 'USER',
  })
}
