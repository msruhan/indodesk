import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { serializePaymentIntent } from '@/lib/payments/payment-intent'
import { loadMarketplacePaymentBreakdown } from '@/lib/marketplace-payment-breakdown'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ merchantRef: string }> }

/** GET /api/payments/tripay/[merchantRef] — payment intent status for polling */
export async function GET(_req: Request, context: RouteContext) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { merchantRef } = await context.params
  const intent = await prisma.paymentIntent.findUnique({
    where: { merchantRef },
  })

  if (!intent) return apiError('Pembayaran tidak ditemukan', 404)
  if (intent.userId !== session.user.id) return apiError('Unauthorized', 403)

  let orderCode: string | null = null
  if (intent.purpose === 'CATALOG_TOPUP' && intent.targetId) {
    const topup = await prisma.topupOrder.findUnique({
      where: { id: intent.targetId },
      select: { orderCode: true },
    })
    orderCode = topup?.orderCode ?? null
  }

  const marketplaceBreakdown =
    intent.purpose === 'MARKETPLACE' && intent.targetId
      ? await loadMarketplacePaymentBreakdown(intent.targetId)
      : null

  return apiSuccess({
    ...serializePaymentIntent(intent),
    orderCode,
    marketplaceBreakdown,
  })
}
