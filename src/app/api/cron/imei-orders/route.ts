import { apiError, apiSuccess } from '@/lib/api-auth'
import { processImeiOrderQueue } from '@/lib/imei-order-worker'
import { processServerOrderQueue } from '@/lib/server-order-worker'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET/POST /api/cron/imei-orders
 * Submit pending IMEI + server orders to supplier & poll status updates.
 * Protect with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
 *
 * Backup untuk deploy serverless (Vercel Cron). Server long-running memakai
 * instrumentation scheduler otomatis — tidak perlu panggil manual.
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
    const [imei, server] = await Promise.all([
      processImeiOrderQueue(),
      processServerOrderQueue(),
    ])
    return apiSuccess({
      message: 'IMEI & server order queues processed',
      imei,
      server,
    })
  } catch (e) {
    console.error('[CRON_IMEI_ORDERS]', e)
    return apiError('Gagal memproses antrian order IMEI', 500)
  }
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
