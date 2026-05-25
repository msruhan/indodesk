import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { adminResetUserTwoFactor } from '@/lib/admin-reset-2fa'

export const dynamic = 'force-dynamic'

/** POST — nonaktifkan & reset 2FA teknisi (role TEKNISI). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!admin) return apiError('Admin tidak ditemukan', 401)

  try {
    const result = await adminResetUserTwoFactor(id, admin, req)
    if (!result.ok) return apiError(result.error, result.status)
    return apiSuccess(result.data)
  } catch (e) {
    console.error('[ADMIN_TEKNISI_RESET_2FA_POST]', e)
    return apiError('Gagal reset 2FA', 500)
  }
}
