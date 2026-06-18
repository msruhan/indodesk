import { prisma } from '@/lib/db'
import { addDays } from '@/lib/marketplace-order-deadlines'
import { resolveComplaintRefundFull } from '@/lib/marketplace-complaint-resolve'

export const BUYER_RETURN_DAYS = 3
export const SELLER_CONFIRM_DAYS = 2

/** Status komplain yang memblokir auto-complete order */
export const ACTIVE_COMPLAINT_STATUSES = [
  'OPEN',
  'SELLER_RESPONDED',
  'AWAITING_RETURN',
  'RETURN_SHIPPED',
  'AWAITING_SELLER_CONFIRM',
  'ESCALATED',
] as const

export function computeReturnDeadline(from: Date = new Date()): Date {
  return addDays(from, BUYER_RETURN_DAYS)
}

export function computeSellerConfirmDeadline(from: Date = new Date()): Date {
  return addDays(from, SELLER_CONFIRM_DAYS)
}

/** OPEN / SELLER_RESPONDED + sellerDeadline lewat → AWAITING_RETURN */
export async function processComplaintToAwaitingReturn(batchSize = 30): Promise<number> {
  const now = new Date()
  let count = 0

  const due = await prisma.orderComplaint.findMany({
    where: {
      status: { in: ['OPEN', 'SELLER_RESPONDED'] },
      sellerDeadline: { lt: now },
    },
    take: batchSize,
    select: { id: true },
  })

  for (const row of due) {
    await prisma.orderComplaint.update({
      where: { id: row.id },
      data: {
        status: 'AWAITING_RETURN',
        returnDeadline: computeReturnDeadline(now),
      },
    })
    count += 1
  }

  return count
}

/** AWAITING_RETURN + returnDeadline lewat → RETURN_EXPIRED + order SHIPPED */
export async function processReturnExpired(batchSize = 30): Promise<number> {
  const now = new Date()
  let count = 0

  const expired = await prisma.orderComplaint.findMany({
    where: {
      status: 'AWAITING_RETURN',
      returnDeadline: { lt: now },
    },
    take: batchSize,
    select: { id: true, orderId: true },
  })

  for (const row of expired) {
    await prisma.$transaction([
      prisma.orderComplaint.update({
        where: { id: row.id },
        data: { status: 'RETURN_EXPIRED' },
      }),
      prisma.order.update({
        where: { id: row.orderId },
        data: { status: 'SHIPPED' },
      }),
    ])
    count += 1
  }

  return count
}

/** AWAITING_SELLER_CONFIRM + sellerConfirmDeadline lewat → auto REFUND_FULL */
export async function processSellerConfirmAutoRefund(batchSize = 20): Promise<number> {
  const now = new Date()
  let count = 0

  const due = await prisma.orderComplaint.findMany({
    where: {
      status: 'AWAITING_SELLER_CONFIRM',
      sellerConfirmDeadline: { lt: now },
    },
    take: batchSize,
    select: { id: true },
  })

  for (const row of due) {
    try {
      await resolveComplaintRefundFull(row.id, {
        id: 'system',
        name: 'Sistem',
        email: null,
        role: 'ADMIN',
      }, { auto: true })
      count += 1
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_COMPLAINT_STATUS') continue
      throw e
    }
  }

  return count
}

export async function processMarketplaceReturnDeadlines() {
  const awaitingReturn = await processComplaintToAwaitingReturn()
  const returnExpired = await processReturnExpired()
  const autoRefunded = await processSellerConfirmAutoRefund()
  return { awaitingReturn, returnExpired, autoRefunded }
}
