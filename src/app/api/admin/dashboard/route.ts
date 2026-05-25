import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getAdminDashboardData } from '@/lib/admin-dashboard-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const data = await getAdminDashboardData()
    return apiSuccess(data)
  } catch (e) {
    console.error('[ADMIN_DASHBOARD_GET]', e)
    return apiError('Gagal memuat dashboard', 500)
  }
}
