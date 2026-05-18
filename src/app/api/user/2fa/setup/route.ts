import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { buildTotpUri, generateTotpSecret, totpQrDataUrl } from '@/lib/totp'

export const dynamic = 'force-dynamic'

/** Generate TOTP secret + QR for Google Authenticator (not enabled until verified). */
export async function POST() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, twoFactorEnabled: true },
    })
    if (!user) return apiError('User tidak ditemukan', 404)
    if (user.twoFactorEnabled) {
      return apiError('2FA sudah aktif. Nonaktifkan terlebih dahulu jika ingin mengatur ulang.')
    }

    const secret = generateTotpSecret()
    const otpauthUri = buildTotpUri(user.email, secret)
    const qrDataUrl = await totpQrDataUrl(otpauthUri)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    })

    return apiSuccess({
      qrDataUrl,
      manualEntryKey: secret,
    })
  } catch (e) {
    console.error('[USER_2FA_SETUP_POST]', e)
    return apiError('Gagal menyiapkan 2FA', 500)
  }
}
