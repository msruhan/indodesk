import { apiError, apiSuccess } from '@/lib/api-auth'
import { validateCronSecret } from '@/lib/cron-auth'
import { processOrderTrackingQueue } from '@/lib/order-tracking-worker'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET/POST /api/cron/order-tracking
 * Sync shipment tracking dari BinderByte untuk order yang jatuh tempo.
 * Authorization: Bearer <CRON_SECRET>
 */
async function handle(req: Request) {
  const cronAuth = validateCronSecret(req)
  if (cronAuth) return cronAuth

  try {
    const stats = await processOrderTrackingQueue()
    return apiSuccess({
      message: 'Order tracking queue processed',
      ...stats,
    })
  } catch (e) {
    console.error('[CRON_ORDER_TRACKING]', e)
    return apiError('Gagal memproses antrian tracking', 500)
  }
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
