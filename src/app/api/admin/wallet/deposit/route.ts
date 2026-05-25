/**
 * POST /api/admin/wallet/deposit
 * Admin melakukan deposit manual ke wallet user/teknisi.
 *
 * Body:
 *   - userId: string  (target wallet)
 *   - amount: number  (positif, dalam IDR)
 *   - method: 'manual' | 'gateway-sim' (default 'manual')
 *   - note:   string  (alasan / catatan)
 *   - reference?: string (mis. nomor bukti / VA / order PG)
 */

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  buildGatewayDepositDescription,
  buildManualDepositDescription,
} from '@/lib/admin-saldo'
import { extractRequestContext, logAdminEvent, logPaymentEvent } from '@/lib/activity-log'

export const dynamic = 'force-dynamic'

const depositSchema = z.object({
  userId: z.string().min(1),
  amount: z
    .number()
    .int('Jumlah harus bilangan bulat')
    .positive('Jumlah deposit harus lebih dari 0')
    .max(1_000_000_000, 'Jumlah deposit terlalu besar'),
  method: z.enum(['manual', 'gateway-sim']).default('manual'),
  note: z.string().max(500).optional().default(''),
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

    const description =
      parsed.method === 'manual'
        ? buildManualDepositDescription(parsed.note, adminName)
        : buildGatewayDepositDescription(
            parsed.note || 'Payment gateway',
            parsed.reference || `${Date.now()}`,
          )

    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId: parsed.userId } })
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: parsed.userId, balance: 0 } })
      }
      const newBalance = new Prisma.Decimal(wallet.balance).add(parsed.amount)
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      })
      const ledger = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: 'TOPUP',
          amount: new Prisma.Decimal(parsed.amount),
          balance: newBalance,
          description,
          referenceId: parsed.method === 'manual' ? adminId : parsed.reference || null,
        },
      })
      return { wallet: updated, ledger }
    })

    const ctx = extractRequestContext(req)
    void logPaymentEvent({
      action: parsed.method === 'manual' ? 'payment.deposit.manual' : 'payment.deposit.gateway',
      severity: 'SUCCESS',
      summary:
        parsed.method === 'manual'
          ? `Admin ${adminName} deposit Rp ${parsed.amount.toLocaleString('id-ID')} ke ${targetUser.name}`
          : `Deposit otomatis Rp ${parsed.amount.toLocaleString('id-ID')} untuk ${targetUser.name}`,
      detail: parsed.note || null,
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
        targetRole: targetUser.role,
        balanceAfter: result.wallet.balance.toString(),
        reference: parsed.reference || null,
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
      metadata: {
        amount: parsed.amount,
        method: parsed.method,
      },
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
