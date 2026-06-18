import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { approveDepositRequest, DualControlError } from '@/lib/wallet/dual-control'
import { RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const rl = await withRateLimit(req, ['admin', 'deposit-approve', session.user.id], RATE_LIMITS.adminHeavy)
  if (!rl.allowed) return rateLimitResponse(rl)

  const { id } = await params

  try {
    const updated = await approveDepositRequest(id, session.user.id)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.wallet.deposit.approve',
      summary: `Deposit ${id} disetujui`,
      severity: 'CRITICAL',
      target: { type: 'wallet_deposit', id: updated.id },
      metadata: { ledgerId: updated.ledgerId, status: updated.status },
    })

    return apiSuccess({
      id: updated.id,
      status: updated.status,
      ledgerId: updated.ledgerId,
    })
  } catch (e) {
    if (e instanceof DualControlError) {
      return apiError(e.message, 400, { code: e.code })
    }
    console.error('[ADMIN_WALLET_DEPOSIT_APPROVE_POST]', e)
    return apiError('Gagal menyetujui deposit', 500)
  }
}
