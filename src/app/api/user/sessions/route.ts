import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { listUserSessions } from '@/lib/auth/session-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const sessions = await listUserSessions(session.user.id)
    return apiSuccess({ sessions })
  } catch (e) {
    console.error('[USER_SESSIONS_GET]', e)
    return apiError('Gagal memuat sesi aktif', 500)
  }
}
