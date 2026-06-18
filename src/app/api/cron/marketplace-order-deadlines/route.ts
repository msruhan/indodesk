import { apiError, apiSuccess } from '@/lib/api-auth'
import { validateCronSecret } from '@/lib/cron-auth'
import { processMarketplaceOrderDeadlines } from '@/lib/marketplace-order-deadlines'
import { processPackagingDeadlines } from '@/lib/marketplace-packaging-deadlines'
import { processMarketplaceReturnDeadlines } from '@/lib/marketplace-return-deadlines'
import { processReturnTrackingQueue } from '@/lib/return-tracking-worker'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function handle(req: Request) {
  const cronAuth = validateCronSecret(req)
  if (cronAuth) return cronAuth

  try {
    const stats = await processMarketplaceOrderDeadlines()
    const packaging = await processPackagingDeadlines()
    const returns = await processMarketplaceReturnDeadlines()
    const returnTracking = await processReturnTrackingQueue()
    return apiSuccess({
      message: 'Marketplace order deadlines processed',
      ...stats,
      packaging,
      returns,
      returnTracking,
    })
  } catch (e) {
    console.error('[CRON_MARKETPLACE_ORDER_DEADLINES]', e)
    return apiError('Gagal memproses deadline pesanan', 500)
  }
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
