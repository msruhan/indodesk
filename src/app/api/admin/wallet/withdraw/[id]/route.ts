import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import {
  completeWithdrawRequest,
  rejectWithdrawCancel,
  rejectWithdrawConfirmRelease,
  rejectWithdrawInit,
  serializeWithdrawRequest,
  WithdrawError,
} from '@/lib/wallet/withdraw'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  action: z.enum([
    'complete',
    'reject_init',
    'reject_confirm_release',
    'reject_cancel',
  ]),
  proofUrl: z.string().url().optional(),
  adminNote: z.string().max(500).optional(),
  rejectionNote: z.string().max(500).optional(),
  confirmPassword: z.string().min(1).optional(),
  totp: z.string().min(1).optional(),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await ctx.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const { action, confirmPassword, totp, proofUrl, adminNote, rejectionNote } = parsed.data

  try {
    if (action === 'reject_cancel') {
      const row = await rejectWithdrawCancel(id)
      logAdminGovernance({
        req,
        actor: session.user,
        action: 'admin.wallet.withdraw.reject_cancel',
        summary: `Penolakan withdraw ${id} dibatalkan`,
        severity: 'INFO',
        target: { type: 'wallet_withdraw', id: row.id },
      })
      return apiSuccess({ request: serializeWithdrawRequest(row) })
    }

    await verifyAdminStepUp(session.user.id, { confirmPassword, totp })

    if (action === 'complete') {
      const row = await completeWithdrawRequest(id, session.user.id, { proofUrl, adminNote })
      logAdminGovernance({
        req,
        actor: session.user,
        action: 'admin.wallet.withdraw.complete',
        summary: `Withdraw ${id} diselesaikan`,
        severity: 'CRITICAL',
        target: { type: 'wallet_withdraw', id: row.id, label: row.user.email },
        metadata: { amount: row.amount.toString() },
      })
      return apiSuccess({ request: serializeWithdrawRequest(row) })
    }

    if (action === 'reject_init') {
      if (!rejectionNote?.trim()) {
        return apiError('Alasan penolakan wajib diisi')
      }
      const row = await rejectWithdrawInit(id, session.user.id, rejectionNote)
      logAdminGovernance({
        req,
        actor: session.user,
        action: 'admin.wallet.withdraw.reject_init',
        summary: `Withdraw ${id} ditolak (inisiasi)`,
        severity: 'WARNING',
        target: { type: 'wallet_withdraw', id: row.id },
      })
      return apiSuccess({ request: serializeWithdrawRequest(row) })
    }

    if (action === 'reject_confirm_release') {
      const row = await rejectWithdrawConfirmRelease(id, session.user.id)
      logAdminGovernance({
        req,
        actor: session.user,
        action: 'admin.wallet.withdraw.reject_confirm',
        summary: `Withdraw ${id} ditolak (dana dikembalikan)`,
        severity: 'CRITICAL',
        target: { type: 'wallet_withdraw', id: row.id },
      })
      return apiSuccess({ request: serializeWithdrawRequest(row) })
    }

    return apiError('Aksi tidak dikenal')
  } catch (e) {
    if (e instanceof StepUpAuthError) {
      return apiError(e.message, 401, { code: e.code })
    }
    if (e instanceof WithdrawError) {
      return apiError(e.message, 400, { code: e.code })
    }
    console.error('[ADMIN_WALLET_WITHDRAW_PATCH]', e)
    return apiError('Gagal memperbarui permintaan penarikan', 500)
  }
}
