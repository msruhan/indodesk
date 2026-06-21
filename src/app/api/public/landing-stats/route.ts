import { apiError, apiSuccess } from '@/lib/api-auth'
import { getLandingPublicStats } from '@/lib/landing-public-stats'

export const dynamic = 'force-dynamic'

/** GET /api/public/landing-stats — metrik publik untuk landing page */
export async function GET() {
  try {
    const stats = await getLandingPublicStats()
    return apiSuccess(stats)
  } catch (e) {
    console.error('[PUBLIC_LANDING_STATS_GET]', e)
    return apiError('Gagal memuat statistik', 500)
  }
}
