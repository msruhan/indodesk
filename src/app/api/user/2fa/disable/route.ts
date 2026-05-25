import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { verifyTotpCode } from '@/lib/totp'

export const dynamic = 'force-dynamic'

const schema = z.object({
  password: z.string().min(1, 'Password wajib diisi'),
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
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, twoFactorSecret: true, twoFactorEnabled: true },
    })
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return apiError('2FA belum aktif')
    }
    if (!user.password) {
      return apiError('Akun tidak memiliki password lokal')
    }

    const validPassword = await compare(parsed.data.password, user.password)
    if (!validPassword) {
      return apiError('Password tidak sesuai', 401)
    }

    if (!(await verifyTotpCode(parsed.data.code, user.twoFactorSecret))) {
      return apiError('Kode Google Authenticator tidak valid', 401)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    return apiSuccess({ enabled: false })
  } catch (e) {
    console.error('[USER_2FA_DISABLE_POST]', e)
    return apiError('Gagal menonaktifkan 2FA', 500)
  }
}
