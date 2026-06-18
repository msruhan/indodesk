/**
 * POST /api/admin/wallet/deposit
 * Admin melakukan deposit manual ke wallet user/teknisi.
 */

import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  buildGatewayDepositDescription,
  buildManualDepositDescription,
} from '@/lib/admin-saldo'
import { extractRequestContext, logAdminEvent, logPaymentEvent } from '@/lib/activity-log'
import { executeWalletDeposit } from '@/lib/wallet/deposit'
import {
  createPendingDepositRequest,
  getDualControlThreshold,
  requiresDualControl,
} from '@/lib/wallet/dual-control'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const depositSchema = z.object({
  userId: z.string().min(1),
  amount: z
    .number()
    .int('Jumlah harus bilangan bulat')
    .positive('Jumlah deposit harus lebih dari 0')
    .max(1_000_000_000, 'Jumlah deposit terlalu besar'),
  method: z.enum(['manual', 'gateway-sim']).default('manual'),
  note: z.string().min(10, 'Justifikasi wajib minimal 10 karakter').max(500),
  reasonCategory: z.enum(['promo', 'refund', 'correction', 'partnership', 'other']).optional(),
  reference: z.string().max(120).optional().default(''),
})

export async function POST(req: Request) {
  const auth = await requireApiRole(['ADMIN'])
  if (auth.error) return auth.error
  const adminName = auth.session.user.name ?? 'Admin'
  const adminId = auth.session.user.id

  let parsed
  try {
    parsed = depositSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return apiError(e.issues[0]?.message ?? 'Data tidak valid')
    }
    return apiError('Body tidak valid')
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, name: true, role: true },
    })
    if (!targetUser) return apiError('User tidak ditemukan', 404)
    if (targetUser.role === 'ADMIN') {
      return apiError('Deposit tidak diperbolehkan untuk akun ADMIN')
    }

    if (requiresDualControl(parsed.amount)) {
      const pending = await createPendingDepositRequest({
        userId: parsed.userId,
        amount: parsed.amount,
        note: parsed.note,
        reasonCategory: parsed.reasonCategory,
        method: parsed.method,
        reference: parsed.reference,
        requestedById: adminId,
      })
      return apiSuccess(
        {
          dualControlRequired: true,
          depositRequestId: pending.id,
          status: pending.status,
          threshold: getDualControlThreshold(),
          message:
            'Deposit melebihi batas dual-control. Diperlukan persetujuan 2 admin berbeda.',
        },
        202,
      )
    }

    const description =
      parsed.method === 'manual'
        ? buildManualDepositDescription(parsed.note, adminName)
        : buildGatewayDepositDescription(
            parsed.note || 'Payment gateway',
            parsed.reference || `${Date.now()}`,
          )

    const result = await executeWalletDeposit({
      userId: parsed.userId,
      amount: parsed.amount,
      description,
      referenceId: parsed.method === 'manual' ? adminId : parsed.reference || null,
    })

    const ctx = extractRequestContext(req)
    void logPaymentEvent({
      action: parsed.method === 'manual' ? 'payment.deposit.manual' : 'payment.deposit.gateway',
      severity: 'SUCCESS',
      summary:
        parsed.method === 'manual'
          ? `Admin ${adminName} deposit Rp ${parsed.amount.toLocaleString('id-ID')} ke ${targetUser.name}`
          : `Deposit otomatis Rp ${parsed.amount.toLocaleString('id-ID')} untuk ${targetUser.name}`,
      detail: parsed.note,
      actor: {
        id: adminId,
        name: adminName,
        email: auth.session.user.email ?? null,
        role: 'ADMIN',
      },
      target: { type: 'user', id: targetUser.id, label: targetUser.name },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: {
        amount: parsed.amount,
        method: parsed.method,
        reasonCategory: parsed.reasonCategory,
        targetRole: targetUser.role,
        balanceAfter: result.wallet.balance.toString(),
      },
    })
    void logAdminEvent({
      action: 'admin.deposit',
      severity: 'INFO',
      summary: `${adminName} melakukan deposit ke ${targetUser.name}`,
      actor: {
        id: adminId,
        name: adminName,
        email: auth.session.user.email ?? null,
        role: 'ADMIN',
      },
      target: { type: 'user', id: targetUser.id, label: targetUser.name },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { amount: parsed.amount, method: parsed.method },
    })

    return apiSuccess(
      {
        ledgerId: result.ledger.id,
        userId: targetUser.id,
        userName: targetUser.name,
        balance: result.wallet.balance.toString(),
        amount: parsed.amount,
        method: parsed.method,
        note: parsed.note,
        description,
      },
      201,
    )
  } catch (e) {
    console.error('[ADMIN_WALLET_DEPOSIT_POST]', e)
    return apiError('Gagal melakukan deposit', 500)
  }
}
