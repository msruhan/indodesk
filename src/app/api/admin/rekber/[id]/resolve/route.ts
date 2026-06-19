import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminEvent, logPaymentEvent } from '@/lib/activity-log'
import { refundRekberToBuyer, releaseRekberToSeller } from '@/lib/rekber-wallet'
import { walletTransaction } from '@/lib/wallet/transaction'
import { serializeRekber } from '@/lib/rekber-serializer'
import { REKBER_INCLUDE } from '@/lib/rekber-includes'

export const dynamic = 'force-dynamic'

const resolveSchema = z.object({
  action: z.enum(['release', 'refund']),
  note: z.string().max(1000).optional(),
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

  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    const existing = await prisma.rekberTransaction.findUnique({
      where: { id },
      include: REKBER_INCLUDE,
    })
    if (!existing) return apiError('Transaksi aman tidak ditemukan', 404)

    if (existing.status === 'RELEASED' || existing.status === 'REFUNDED') {
      return apiError('State tidak valid', 409, { code: 'INVALID_STATE' })
    }
    if (!['HELD', 'PROCESSING', 'SHIPPED', 'DISPUTED'].includes(existing.status)) {
      return apiError('Hanya transaksi aman aktif atau dispute yang bisa diselesaikan admin')
    }

    const amount = existing.amount
    const fee = existing.fee
    const totalHold = amount.add(fee)
    const adminNote = parsed.data.note?.trim()

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'ADMIN' as const,
    }

    if (parsed.data.action === 'release') {
      const updated = await walletTransaction(async (tx) => {
        await releaseRekberToSeller(
          tx,
          existing.sellerId,
          amount,
          id,
          existing.orderCode,
        )
        return tx.rekberTransaction.update({
          where: { id },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
            note: adminNote ?? existing.note,
          },
          include: REKBER_INCLUDE,
        })
      })

      void logPaymentEvent({
        action: 'rekber.admin_release',
        severity: 'SUCCESS',
        summary: `Admin melepas dana rekber ${existing.orderCode}`,
        actor,
        target: { type: 'rekber', id, label: existing.orderCode },
      })
      void logAdminEvent({
        action: 'rekber.resolve.release',
        severity: 'SUCCESS',
        summary: `Resolve rekber ${existing.orderCode} → release`,
        actor,
        target: { type: 'rekber', id, label: existing.orderCode },
      })

      return apiSuccess(serializeRekber(updated, { viewerRole: 'ADMIN' }))
    }

    const updated = await walletTransaction(async (tx) => {
      await refundRekberToBuyer(
        tx,
        existing.buyerId,
        totalHold,
        id,
        existing.orderCode,
      )
      return tx.rekberTransaction.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          note: adminNote ?? existing.note,
        },
        include: REKBER_INCLUDE,
      })
    })

    void logPaymentEvent({
      action: 'rekber.admin_refund',
      severity: 'WARNING',
      summary: `Admin refund rekber ${existing.orderCode}`,
      actor,
      target: { type: 'rekber', id, label: existing.orderCode },
    })
    void logAdminEvent({
      action: 'rekber.resolve.refund',
      severity: 'WARNING',
      summary: `Resolve rekber ${existing.orderCode} → refund`,
      actor,
      target: { type: 'rekber', id, label: existing.orderCode },
    })

    return apiSuccess(serializeRekber(updated, { viewerRole: 'ADMIN' }))
  } catch (e) {
    if (e instanceof Error && e.message === 'SELLER_WALLET_NOT_FOUND') {
      return apiError('Wallet penjual tidak ditemukan', 400)
    }
    console.error('[ADMIN_REKBER_RESOLVE]', e)
    return apiError('Gagal menyelesaikan transaksi aman', 500)
  }
}
