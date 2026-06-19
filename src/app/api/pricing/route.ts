import { apiError, apiSuccess } from '@/lib/api-auth'
import { getLandingPricingSectionWithFallback } from '@/lib/pricing-plans-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getLandingPricingSectionWithFallback()
    return apiSuccess(data)
  } catch (e) {
    console.error('[PRICING_GET]', e)
    return apiError('Gagal memuat pricing', 500)
  }
}
