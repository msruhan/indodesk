import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { setGoogleLinkIntentCookie } from '@/lib/auth/google-link-cookie'
import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'

export async function POST() {
  if (!isGoogleAuthEnabled) {
    return apiError('Login Google belum dikonfigurasi', 503)
  }

  const { session, error } = await requireApiAuth()
  if (error) return error

  if (session.user.role === 'ADMIN') {
    return apiError('Akun admin tidak dapat menghubungkan Google', 403)
  }

  await setGoogleLinkIntentCookie(session.user.id)
  return apiSuccess({ ok: true })
}
