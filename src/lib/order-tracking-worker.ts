import { prisma } from '@/lib/db'
import { isBinderbyteConfigured } from '@/lib/binderbyte-client'
import { refreshOrderTracking } from '@/lib/order-tracking-sync'

const DEFAULT_MAX_PER_TICK = 15

function getMaxPerTick(): number {
  const raw = process.env.ORDER_TRACKING_MAX_SYNC_PER_TICK
  if (!raw) return DEFAULT_MAX_PER_TICK
  const n = Number(raw)
  return Number.isFinite(n) && n >= 1 && n <= 50 ? n : DEFAULT_MAX_PER_TICK
}

export type OrderTrackingQueueStats = {
  processed: number
  succeeded: number
  failed: number
  skipped: boolean
}

/** Proses order yang jadwal sync-nya sudah jatuh tempo (hemat kuota BinderByte). */
export async function processOrderTrackingQueue(): Promise<OrderTrackingQueueStats> {
  if (!isBinderbyteConfigured()) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: true }
  }

  const max = getMaxPerTick()
  const now = new Date()

  const due = await prisma.order.findMany({
    where: {
      trackingActive: true,
      trackingNumber: { not: null },
      shippingCourier: { not: null },
      status: { in: ['SHIPPED', 'PROCESSING'] },
      trackingNextSyncAt: { lte: now },
    },
    orderBy: { trackingNextSyncAt: 'asc' },
    take: max,
    select: { id: true },
  })

  let succeeded = 0
  let failed = 0

  for (const row of due) {
    try {
      await refreshOrderTracking(row.id)
      succeeded++
    } catch (e) {
      failed++
      console.error(`[ORDER_TRACKING] sync failed ${row.id}:`, e)
    }
  }

  return {
    processed: due.length,
    succeeded,
    failed,
    skipped: false,
  }
}
