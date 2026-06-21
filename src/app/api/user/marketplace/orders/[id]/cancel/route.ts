import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { logOrderEvent } from '@/lib/activity-log'
import { cancelMarketplaceAwaitingPaymentInTx } from '@/lib/payments/fulfill/marketplace'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import { getPlatformSettings } from '@/lib/platform-settings'
import {
  canBuyerInstantCancel,
  CANCEL_REASON_MIN_LENGTH,
  cancelMarketplaceOrderInTx,
  hasBuyerRefundForOrder,
  validateCancelReason,
} from '@/lib/marketplace-order-cancellation'
import { ACTIVE_COMPLAINT_STATUSES } from '@/lib/marketplace-return-deadlines'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

const instantCancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(CANCEL_REASON_MIN_LENGTH, `Alasan pembatalan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
    .max(500),
})

/** POST /api/user/marketplace/orders/[id]/cancel — batalkan sebelum bayar atau instan setelah bayar */
export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await context.params

  try {
    const existing = await prisma.order.findFirst({
      where: { id, buyerId: session.user.id },
      include: {
        items: { select: { productId: true, quantity: true } },
        cancellationRequest: true,
        complaint: { select: { status: true } },
      },
    })

    if (!existing) return apiError('Pesanan tidak ditemukan', 404)

    if (existing.status === 'AWAITING_PAYMENT') {
      if (!existing.checkoutBatchId) {
        return apiError('Pesanan tidak valid untuk dibatalkan')
      }

      const batchOrderCount = await prisma.order.count({
        where: {
          checkoutBatchId: existing.checkoutBatchId,
          status: 'AWAITING_PAYMENT',
        },
      })

      const updated = await prisma.$transaction(async (tx) => {
        await cancelMarketplaceAwaitingPaymentInTx(
          tx,
          existing.checkoutBatchId!,
          'Dibatalkan oleh pembeli',
          'BUYER',
        )

        await tx.paymentIntent.updateMany({
          where: {
            purpose: 'MARKETPLACE',
            targetId: existing.checkoutBatchId,
            status: 'UNPAID',
          },
          data: { status: 'EXPIRED' },
        })

        return tx.order.findUnique({
          where: { id: existing.id },
          include: MARKETPLACE_ORDER_INCLUDE,
        })
      })

      if (!updated) return apiError('Pesanan tidak ditemukan', 404)

      const platformSettings = await getPlatformSettings()

      void logOrderEvent({
        action: 'marketplace.cancelled',
        severity: 'INFO',
        summary: `Order ${existing.orderCode} dibatalkan pembeli sebelum bayar`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        },
        target: { type: 'marketplace_order', id: existing.id, label: existing.orderCode },
        metadata: { batchOrderCount },
      })

      return apiSuccess(
        serializeMarketplaceOrder(updated, {
          viewerId: session.user.id,
          viewerRole: session.user.role,
          buyerFlatFeePerItem: platformSettings.buyerFlatFeePerItem,
        }),
      )
    }

    if (existing.status !== 'PAID') {
      return apiError('Pesanan tidak dapat dibatalkan pada status ini')
    }

    const hasPendingRequest = existing.cancellationRequest?.status === 'PENDING'
    if (!canBuyerInstantCancel(existing, hasPendingRequest)) {
      return apiError(
        'Pembatalan instan hanya tersedia dalam 1 jam setelah bayar dan sebelum pesanan diproses',
      )
    }

    if (
      existing.complaint &&
      (ACTIVE_COMPLAINT_STATUSES as readonly string[]).includes(existing.complaint.status)
    ) {
      return apiError('Pesanan dengan komplain aktif tidak dapat dibatalkan')
    }

    let body: unknown = {}
    try {
      body = await req.json()
    } catch {
      return apiError(`Alasan pembatalan wajib diisi (min. ${CANCEL_REASON_MIN_LENGTH} karakter)`)
    }

    const parsed = instantCancelSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Alasan tidak valid')
    }

    const reasonError = validateCancelReason(parsed.data.reason)
    if (reasonError) return apiError(reasonError)

    if (await hasBuyerRefundForOrder(existing.id, existing.buyerId)) {
      return apiError('Pesanan ini sudah dibatalkan / direfund')
    }

    const updated = await prisma.$transaction(async (tx) => {
      await cancelMarketplaceOrderInTx(tx, existing, {
        cancelledBy: 'BUYER',
        cancelReason: parsed.data.reason.trim(),
      })

      return tx.order.findUnique({
        where: { id: existing.id },
        include: MARKETPLACE_ORDER_INCLUDE,
      })
    })

    if (!updated) return apiError('Pesanan tidak ditemukan', 404)

    const platformSettings = await getPlatformSettings()

    void logOrderEvent({
      action: 'marketplace.cancelled',
      severity: 'INFO',
      summary: `Order ${existing.orderCode} dibatalkan instan oleh pembeli — refund ke Saldo Bantoo`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'marketplace_order', id: existing.id, label: existing.orderCode },
      metadata: { instant: true, refundTo: 'wallet' },
    })

    return apiSuccess(
      serializeMarketplaceOrder(updated, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
        buyerFlatFeePerItem: platformSettings.buyerFlatFeePerItem,
      }),
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'WALLET_NOT_FOUND') {
      return apiError('Wallet pembeli tidak ditemukan', 400)
    }
    if (e instanceof Error && e.message === 'SELLER_WALLET_NOT_FOUND') {
      return apiError('Wallet penjual tidak ditemukan', 400)
    }
    console.error('[USER_MARKETPLACE_ORDER_CANCEL]', e)
    return apiError('Gagal membatalkan pesanan', 500)
  }
}
