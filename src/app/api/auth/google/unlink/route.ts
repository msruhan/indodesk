import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { logAuthEvent } from '@/lib/activity-log'
import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'

export async function DELETE() {
  if (!isGoogleAuthEnabled) {
    return apiError('Login Google belum dikonfigurasi', 503)
  }

  const { session, error } = await requireApiAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, password: true },
  })
  if (!user) return apiError('User tidak ditemukan', 404)

  if (!user.password) {
    return apiError(
      'Tidak dapat memutus Google — akun ini hanya login via Google. Set password terlebih dahulu.',
      400,
    )
  }

  const googleAccount = await prisma.account.findFirst({
    where: { userId: user.id, provider: 'google' },
  })
  if (!googleAccount) {
    return apiError('Google belum terhubung ke akun ini', 400)
  }

  await prisma.account.delete({ where: { id: googleAccount.id } })

  void logAuthEvent({
    action: 'auth.oauth.unlinked',
    severity: 'INFO',
    summary: `Google diputus dari akun ${user.email}`,
    actor: { id: user.id, name: user.name, email: user.email, role: user.role },
    metadata: { provider: 'google' },
  })

  return apiSuccess({ ok: true })
}
