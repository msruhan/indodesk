import { prisma } from '@/lib/db'
import { isBinderbyteConfigured } from '@/lib/binderbyte-client'
import { refreshReturnTracking } from '@/lib/return-tracking-sync'

const DEFAULT_MAX_PER_TICK = 10

function getMaxPerTick(): number {
  const raw = process.env.RETURN_TRACKING_MAX_SYNC_PER_TICK
  if (!raw) return DEFAULT_MAX_PER_TICK
  const n = Number(raw)
  return Number.isFinite(n) && n >= 1 && n <= 30 ? n : DEFAULT_MAX_PER_TICK
}

export type ReturnTrackingQueueStats = {
  processed: number
  succeeded: number
  failed: number
  skipped: boolean
}

export async function processReturnTrackingQueue(): Promise<ReturnTrackingQueueStats> {
  if (!isBinderbyteConfigured()) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: true }
  }

  const max = getMaxPerTick()
  const now = new Date()

  const due = await prisma.orderComplaint.findMany({
    where: {
      returnTrackingActive: true,
      returnTrackingNumber: { not: null },
      returnCourier: { not: null },
      status: 'RETURN_SHIPPED',
      returnNextSyncAt: { lte: now },
    },
    orderBy: { returnNextSyncAt: 'asc' },
    take: max,
    select: { id: true },
  })

  let succeeded = 0
  let failed = 0

  for (const row of due) {
    try {
      await refreshReturnTracking(row.id)
      succeeded++
    } catch (e) {
      failed++
      console.error(`[RETURN_TRACKING] sync failed ${row.id}:`, e)
    }
  }

  return {
    processed: due.length,
    succeeded,
    failed,
    skipped: false,
  }
}
