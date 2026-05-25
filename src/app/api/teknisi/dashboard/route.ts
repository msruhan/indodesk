import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getTeknisiDashboardData } from '@/lib/teknisi-dashboard-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const data = await getTeknisiDashboardData(session.user.id)
    return apiSuccess(data)
  } catch (e) {
    console.error('[TEKNISI_DASHBOARD_GET]', e)
    return apiError('Gagal memuat dashboard', 500)
  }
}
