/**
 * Background scheduler: sync marketplace shipment tracking via BinderByte.
 */
import { processOrderTrackingQueue } from '@/lib/order-tracking-worker'

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000 // 15 menit

const globalForScheduler = globalThis as typeof globalThis & {
  __orderTrackingSchedulerStarted?: boolean
  __orderTrackingSchedulerRunning?: boolean
}

function getIntervalMs() {
  const raw = process.env.ORDER_TRACKING_POLL_INTERVAL_MS
  if (!raw) return DEFAULT_INTERVAL_MS
  const n = Number(raw)
  return Number.isFinite(n) && n >= 60_000 ? n : DEFAULT_INTERVAL_MS
}

async function runTick() {
  if (globalForScheduler.__orderTrackingSchedulerRunning) return
  globalForScheduler.__orderTrackingSchedulerRunning = true
  try {
    const stats = await processOrderTrackingQueue()
    if (stats.processed > 0) {
      console.log(
        `[ORDER_TRACKING] tick: ${stats.succeeded}/${stats.processed} ok, ${stats.failed} failed`,
      )
    }
  } catch (e) {
    console.error('[ORDER_TRACKING] tick error:', e)
  } finally {
    globalForScheduler.__orderTrackingSchedulerRunning = false
  }
}

export function startOrderTrackingScheduler() {
  if (process.env.ORDER_TRACKING_SCHEDULER_ENABLED === 'false') {
    console.log('[ORDER_TRACKING] Disabled via ORDER_TRACKING_SCHEDULER_ENABLED=false')
    return
  }
  if (globalForScheduler.__orderTrackingSchedulerStarted) return
  globalForScheduler.__orderTrackingSchedulerStarted = true

  const intervalMs = getIntervalMs()
  console.log(
    `[ORDER_TRACKING] Active — poll antrian setiap ${intervalMs / 1000}s (max ${process.env.ORDER_TRACKING_MAX_SYNC_PER_TICK ?? 15}/tick)`,
  )

  setTimeout(() => void runTick(), 12_000)
  setInterval(() => void runTick(), intervalMs)
}
