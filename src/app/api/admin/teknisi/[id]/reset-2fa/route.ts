import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { adminResetUserTwoFactor } from '@/lib/admin-reset-2fa'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpSchema } from '@/lib/wallet/admin-step-up-schema'

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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const parsed = adminStepUpSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Konfirmasi admin wajib')
  }

  try {
    await verifyAdminStepUp(session.user.id, parsed.data)
  } catch (e) {
    if (e instanceof StepUpAuthError) {
      return apiError(e.message, 401, { code: e.code })
    }
    throw e
  }

  try {
    const result = await adminResetUserTwoFactor(id, admin, req)
    if (!result.ok) return apiError(result.error, result.status)
    return apiSuccess(result.data)
  } catch (e) {
    console.error('[ADMIN_TEKNISI_RESET_2FA_POST]', e)
    return apiError('Gagal reset 2FA', 500)
  }
}
