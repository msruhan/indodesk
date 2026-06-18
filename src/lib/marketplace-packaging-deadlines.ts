import { prisma } from '@/lib/db'
import { logOrderEvent } from '@/lib/activity-log'
import { cancelOrderForPackagingTimeout } from '@/lib/marketplace-packaging-proof'
import { PACKAGING_ADMIN_SLA_HOURS } from '@/lib/validations/marketplace-packaging'

const MS_PER_HOUR = 60 * 60 * 1000

export async function processPackagingSlaNotifications(batchSize = 30): Promise<number> {
  const cutoff = new Date(Date.now() - PACKAGING_ADMIN_SLA_HOURS * MS_PER_HOUR)
  const rows = await prisma.orderPackagingProof.findMany({
    where: {
      status: 'PENDING',
      submittedAt: { lt: cutoff },
      slaNotifiedAt: null,
    },
    take: batchSize,
    include: { order: { select: { orderCode: true } } },
  })

  let count = 0
  for (const row of rows) {
    await prisma.orderPackagingProof.update({
      where: { id: row.id },
      data: { slaNotifiedAt: new Date() },
    })
    void logOrderEvent({
      action: 'marketplace.packaging_sla_overdue',
      severity: 'WARNING',
      summary: `URGENT: Bukti packaging >24 jam menunggu review — order ${row.order.orderCode}`,
      actor: { id: 'system', name: 'System', email: null, role: 'ADMIN' },
      target: { type: 'marketplace_order', id: row.orderId, label: row.order.orderCode },
    })
    count += 1
  }
  return count
}

export async function processPackagingResubmitTimeouts(batchSize = 30): Promise<number> {
  const now = new Date()
  const rows = await prisma.orderPackagingProof.findMany({
    where: {
      status: 'REJECTED',
      resubmitDeadline: { lt: now },
      order: { status: 'PAID' },
    },
    take: batchSize,
    select: { orderId: true },
  })

  let count = 0
  for (const row of rows) {
    const cancelled = await cancelOrderForPackagingTimeout(row.orderId)
    if (cancelled) count += 1
  }
  return count
}

export async function processPackagingDeadlines() {
  const slaNotified = await processPackagingSlaNotifications()
  const resubmitCancelled = await processPackagingResubmitTimeouts()
  return { slaNotified, resubmitCancelled }
}
