import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { rejectDepositRequest, DualControlError } from '@/lib/wallet/dual-control'

export const dynamic = 'force-dynamic'

const schema = z.object({
  note: z.string().min(3).max(500),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError('Catatan penolakan wajib diisi')

  try {
    const updated = await rejectDepositRequest(id, session.user.id, parsed.data.note)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.wallet.deposit.reject',
      summary: `Deposit ${id} ditolak`,
      severity: 'WARNING',
      target: { type: 'wallet_deposit', id: updated.id },
      metadata: { status: updated.status },
    })

    return apiSuccess({ id: updated.id, status: updated.status })
  } catch (e) {
    if (e instanceof DualControlError) {
      return apiError(e.message, 400, { code: e.code })
    }
    console.error('[ADMIN_WALLET_DEPOSIT_REJECT_POST]', e)
    return apiError('Gagal menolak deposit', 500)
  }
}
