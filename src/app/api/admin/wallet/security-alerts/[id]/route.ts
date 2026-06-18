import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']),
  ...adminStepUpFields,
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

  const existing = await prisma.walletSecurityAlert.findUnique({ where: { id } })
  if (!existing) return apiError('Alert tidak ditemukan', 404)

  if (parsed.data.status === 'DISMISSED') {
    try {
      await verifyAdminStepUp(session.user.id, {
        confirmPassword: parsed.data.confirmPassword,
        totp: parsed.data.totp,
      })
    } catch (e) {
      if (e instanceof StepUpAuthError) {
        return apiError(e.message, 401, { code: e.code })
      }
      throw e
    }
  }

  const row = await prisma.walletSecurityAlert.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolvedAt: ['RESOLVED', 'DISMISSED'].includes(parsed.data.status) ? new Date() : undefined,
      resolvedById: session.user.id,
    },
  })

  logAdminGovernance({
    req,
    actor: session.user,
    action: 'admin.wallet.security_alert.update',
    summary: `Alert keamanan ${existing.ruleCode} → ${parsed.data.status}`,
    severity: parsed.data.status === 'DISMISSED' ? 'WARNING' : 'INFO',
    target: { type: 'wallet_security_alert', id: row.id, label: existing.ruleCode },
    metadata: { previousStatus: existing.status, newStatus: parsed.data.status },
  })

  return apiSuccess({
    alert: {
      id: row.id,
      status: row.status,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    },
  })
}
