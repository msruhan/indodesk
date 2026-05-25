import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/** Batalkan setup 2FA yang belum diverifikasi (hapus secret sementara). */
export async function POST() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    })
    if (!user) return apiError('User tidak ditemukan', 404)
    if (user.twoFactorEnabled) {
      return apiError('2FA sudah aktif')
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: null },
    })

    return apiSuccess({ cancelled: true })
  } catch (e) {
    console.error('[USER_2FA_CANCEL_SETUP_POST]', e)
    return apiError('Gagal membatalkan setup', 500)
  }
}
