import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { revokeUserSession } from '@/lib/auth/session-store'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params
  const revoked = await revokeUserSession(id, session.user.id)
  if (!revoked) return apiError('Sesi tidak ditemukan', 404)

  return apiSuccess({ revoked: true })
}
