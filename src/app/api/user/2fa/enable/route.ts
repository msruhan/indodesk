import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { generateBackupCodesForUser } from '@/lib/auth/backup-codes'
import { consumeTotpCode } from '@/lib/auth/totp-replay'
import { readTotpSecretPlain } from '@/lib/crypto/totp-secret'
import { verifyTotpCode } from '@/lib/totp'

export const dynamic = 'force-dynamic'

const schema = z.object({
  code: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Kode harus 6 digit angka')),
})

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return apiError('Kode verifikasi tidak valid')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })
    if (!user?.twoFactorSecret) {
      return apiError('Jalankan setup 2FA terlebih dahulu')
    }
    if (user.twoFactorEnabled) {
      return apiError('2FA sudah aktif')
    }

    const totpPlain = readTotpSecretPlain(user.twoFactorSecret)
    if (!totpPlain || !(await verifyTotpCode(parsed.data.code, totpPlain))) {
      return apiError('Kode Google Authenticator tidak valid', 401)
    }
    await consumeTotpCode(session.user.id, parsed.data.code)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    })

    const backupCodes = await generateBackupCodesForUser(session.user.id)
    return apiSuccess({
      enabled: true,
      backupCodes,
      message: 'Simpan kode cadangan — hanya ditampilkan sekali.',
    })
  } catch (e) {
    console.error('[USER_2FA_ENABLE_POST]', e)
    return apiError('Gagal mengaktifkan 2FA', 500)
  }
}
