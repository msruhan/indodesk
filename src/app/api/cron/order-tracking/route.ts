import { apiError, apiSuccess } from '@/lib/api-auth'
import { processOrderTrackingQueue } from '@/lib/order-tracking-worker'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET/POST /api/cron/order-tracking
 * Sync shipment tracking dari BinderByte untuk order yang jatuh tempo.
 * Authorization: Bearer <CRON_SECRET>
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return apiError('CRON_SECRET belum dikonfigurasi di server', 503)
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return apiError('Unauthorized', 401)
  }

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
