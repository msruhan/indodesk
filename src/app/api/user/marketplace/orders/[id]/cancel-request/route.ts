import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { logOrderEvent } from '@/lib/activity-log'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import { getPlatformSettings } from '@/lib/platform-settings'
import {
  addHours,
  canBuyerRequestCancellation,
  CANCEL_REASON_MIN_LENGTH,
  SELLER_CANCEL_RESPONSE_HOURS,
  validateCancelReason,
} from '@/lib/marketplace-order-cancellation'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

const requestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(CANCEL_REASON_MIN_LENGTH, `Alasan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
    .max(500),
})

/** POST /api/user/marketplace/orders/[id]/cancel-request — ajukan pembatalan ke penjual */
export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Alasan tidak valid')
  }

  const reasonError = validateCancelReason(parsed.data.reason)
  if (reasonError) return apiError(reasonError)

  try {
    const existing = await prisma.order.findFirst({
      where: { id, buyerId: session.user.id },
      include: { cancellationRequest: true },
    })

    if (!existing) return apiError('Pesanan tidak ditemukan', 404)

    const hasPendingRequest = existing.cancellationRequest?.status === 'PENDING'
    if (!canBuyerRequestCancellation(existing, hasPendingRequest)) {
      return apiError('Pesanan tidak dapat diajukan pembatalan pada status ini')
    }

    const now = new Date()
    const sellerDeadline = addHours(now, SELLER_CANCEL_RESPONSE_HOURS)

    const updated = await prisma.$transaction(async (tx) => {
      await tx.orderCancellationRequest.upsert({
        where: { orderId: existing.id },
        create: {
          orderId: existing.id,
          buyerId: existing.buyerId,
          sellerId: existing.sellerId,
          reason: parsed.data.reason.trim(),
          kind: 'APPROVAL_REQUIRED',
          status: 'PENDING',
          sellerDeadline,
        },
        update: {
          reason: parsed.data.reason.trim(),
          kind: 'APPROVAL_REQUIRED',
          status: 'PENDING',
          sellerDeadline,
          sellerResponse: null,
          resolvedAt: null,
        },
      })

      return tx.order.findUnique({
        where: { id: existing.id },
        include: MARKETPLACE_ORDER_INCLUDE,
      })
    })

    if (!updated) return apiError('Pesanan tidak ditemukan', 404)

    const platformSettings = await getPlatformSettings()

    void logOrderEvent({
      action: 'marketplace.cancel_requested',
      severity: 'INFO',
      summary: `Pembeli mengajukan pembatalan ${existing.orderCode}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'marketplace_order', id: existing.id, label: existing.orderCode },
      metadata: { sellerDeadline: sellerDeadline.toISOString() },
    })

    return apiSuccess(
      serializeMarketplaceOrder(updated, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
        buyerFlatFeePerItem: platformSettings.buyerFlatFeePerItem,
      }),
    )
  } catch (e) {
    console.error('[USER_MARKETPLACE_CANCEL_REQUEST]', e)
    return apiError('Gagal mengajukan pembatalan', 500)
  }
}

/** DELETE /api/user/marketplace/orders/[id]/cancel-request — tarik pengajuan pembatalan */
export async function DELETE(_req: Request, context: RouteContext) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await context.params

  try {
    const existing = await prisma.order.findFirst({
      where: { id, buyerId: session.user.id },
      include: { cancellationRequest: true },
    })

    if (!existing) return apiError('Pesanan tidak ditemukan', 404)

    const request = existing.cancellationRequest
    if (!request || request.status !== 'PENDING') {
      return apiError('Tidak ada pengajuan pembatalan yang aktif')
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.orderCancellationRequest.update({
        where: { id: request.id },
        data: { status: 'WITHDRAWN', resolvedAt: new Date() },
      })

      return tx.order.findUnique({
        where: { id: existing.id },
        include: MARKETPLACE_ORDER_INCLUDE,
      })
    })

    if (!updated) return apiError('Pesanan tidak ditemukan', 404)

    const platformSettings = await getPlatformSettings()

    void logOrderEvent({
      action: 'marketplace.cancel_request_withdrawn',
      severity: 'INFO',
      summary: `Pembeli menarik pengajuan pembatalan ${existing.orderCode}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'marketplace_order', id: existing.id, label: existing.orderCode },
    })

    return apiSuccess(
      serializeMarketplaceOrder(updated, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
        buyerFlatFeePerItem: platformSettings.buyerFlatFeePerItem,
      }),
    )
  } catch (e) {
    console.error('[USER_MARKETPLACE_CANCEL_REQUEST_DELETE]', e)
    return apiError('Gagal menarik pengajuan', 500)
  }
}
