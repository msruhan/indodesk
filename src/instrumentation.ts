/**
 * Runs once when the Next.js server starts.
 * Starts background IMEI order polling (submit pending + check status).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return

  const { startImeiOrderScheduler } = await import('@/lib/imei-order-scheduler')
  const { startServerOrderScheduler } = await import('@/lib/server-order-scheduler')
  const { startOrderTrackingScheduler } = await import('@/lib/order-tracking-scheduler')
  startImeiOrderScheduler()
  startServerOrderScheduler()
  startOrderTrackingScheduler()
}
