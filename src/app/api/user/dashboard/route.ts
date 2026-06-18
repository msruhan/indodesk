import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getUserDashboardData } from '@/lib/user-dashboard-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  try {
    const data = await getUserDashboardData(session.user.id)
    return apiSuccess({
      ...data,
      userName: session.user.name ?? 'User',
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[USER_DASHBOARD_GET]', message, e)
    return apiError('Gagal memuat dashboard', 500)
  }
}
