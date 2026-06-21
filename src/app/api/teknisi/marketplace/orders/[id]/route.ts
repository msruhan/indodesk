import { z } from 'zod'
import { OrderStatus, ShippingCourier } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole, type ApiSession } from '@/lib/api-auth'
import { BinderbyteError, isBinderbyteConfigured } from '@/lib/binderbyte-client'
import { logOrderEvent } from '@/lib/activity-log'
import { syncOrderTrackingFromBinderbyte } from '@/lib/order-tracking-sync'
import { binderbyteCourierMatchesEnum, courierLabelFromBinderbyteCode } from '@/lib/shipping-courier'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import {
  canSellerRejectNewOrder,
  canSellerRespondToCancelRequest,
  cancelMarketplaceOrderInTx,
  hasBuyerRefundForOrder,
  validateCancelReason,
} from '@/lib/marketplace-order-cancellation'

export const dynamic = 'force-dynamic'

const courierEnum = z.nativeEnum(ShippingCourier)

const reasonField = z.string().trim().min(20, 'Alasan minimal 20 karakter').max(500)

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('advance'),
  }),
  z.object({
    action: z.literal('set_shipment'),
    courier: courierEnum,
    trackingNumber: z.string().min(6).max(64),
  }),
  z.object({
    action: z.literal('cancel'),
    reason: reasonField,
  }),
  z.object({
    action: z.literal('reject_order'),
    reason: reasonField,
  }),
  z.object({
    action: z.literal('approve_cancel_request'),
  }),
  z.object({
    action: z.literal('reject_cancel_request'),
    response: z.string().trim().max(500).optional(),
  }),
])

async function sellerCancelOrder(
  existing: Awaited<ReturnType<typeof prisma.order.findFirst>> & {
    items: { productId: string; quantity: number }[]
  },
  cancelReason: string,
  cancelledBy: 'SELLER',
  session: ApiSession,
) {
  if (await hasBuyerRefundForOrder(existing.id, existing.buyerId)) {
    return apiError('Pesanan ini sudah dibatalkan / direfund')
  }

  const updated = await prisma.$transaction(async (tx) => {
    await cancelMarketplaceOrderInTx(tx, existing, {
      cancelledBy,
      cancelReason,
    })

    return tx.order.findUnique({
      where: { id: existing.id },
      include: MARKETPLACE_ORDER_INCLUDE,
    })
  })

  if (!updated) return apiError('Pesanan tidak ditemukan', 404)

  void logOrderEvent({
    action: 'marketplace.cancelled',
    severity: 'WARNING',
    summary: `Order ${existing.orderCode} dibatalkan — refund ke Saldo Bantoo`,
    actor: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'TEKNISI',
    },
    target: { type: 'marketplace_order', id: existing.id, label: existing.orderCode },
  })

  return apiSuccess(
    serializeMarketplaceOrder(updated, {
      viewerId: session.user.id,
      viewerRole: 'TEKNISI',
    }),
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.order.findFirst({
      where: { id, sellerId: session.user.id },
      include: MARKETPLACE_ORDER_INCLUDE,
    })
    if (!row) return apiError('Pesanan tidak ditemukan', 404)

    return apiSuccess(
      serializeMarketplaceOrder(row, {
        viewerId: session.user.id,
        viewerRole: 'TEKNISI',
      }),
    )
  } catch (e) {
    console.error('[TEKNISI_MARKETPLACE_ORDER_GET]', e)
    return apiError('Gagal memuat pesanan', 500)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Aksi tidak valid')
  }

  try {
    const existing = await prisma.order.findFirst({
      where: { id, sellerId: session.user.id },
      include: MARKETPLACE_ORDER_INCLUDE,
    })
    if (!existing) return apiError('Pesanan tidak ditemukan', 404)

    if (parsed.data.action === 'reject_order') {
      if (!canSellerRejectNewOrder(existing)) {
        return apiError('Hanya pesanan baru (belum diproses) yang bisa ditolak')
      }
      return sellerCancelOrder(existing, parsed.data.reason, 'SELLER', session)
    }

    if (parsed.data.action === 'cancel') {
      if (existing.status !== 'PAID' && existing.status !== 'PROCESSING') {
        return apiError('Hanya pesanan dibayar atau diproses yang bisa dibatalkan')
      }
      return sellerCancelOrder(existing, parsed.data.reason, 'SELLER', session)
    }

    if (parsed.data.action === 'approve_cancel_request') {
      const request = existing.cancellationRequest
      if (!canSellerRespondToCancelRequest(request)) {
        return apiError('Tidak ada pengajuan pembatalan yang aktif')
      }

      if (await hasBuyerRefundForOrder(existing.id, existing.buyerId)) {
        return apiError('Pesanan ini sudah dibatalkan / direfund')
      }

      const updated = await prisma.$transaction(async (tx) => {
        await cancelMarketplaceOrderInTx(tx, existing, {
          cancelledBy: 'SELLER',
          cancelReason: request!.reason,
        })

        return tx.order.findUnique({
          where: { id: existing.id },
          include: MARKETPLACE_ORDER_INCLUDE,
        })
      })

      if (!updated) return apiError('Pesanan tidak ditemukan', 404)

      void logOrderEvent({
        action: 'marketplace.cancel_request_approved',
        severity: 'INFO',
        summary: `Penjual setujui pembatalan ${existing.orderCode}`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'TEKNISI',
        },
        target: { type: 'marketplace_order', id, label: existing.orderCode },
      })

      return apiSuccess(
        serializeMarketplaceOrder(updated, {
          viewerId: session.user.id,
          viewerRole: 'TEKNISI',
        }),
      )
    }

    if (parsed.data.action === 'reject_cancel_request') {
      const request = existing.cancellationRequest
      if (!canSellerRespondToCancelRequest(request)) {
        return apiError('Tidak ada pengajuan pembatalan yang aktif')
      }

      const response = parsed.data.response?.trim() || null
      if (response) {
        const responseError = validateCancelReason(response)
        if (responseError) return apiError(responseError)
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.orderCancellationRequest.update({
          where: { id: request!.id },
          data: {
            status: 'REJECTED',
            sellerResponse: response,
            resolvedAt: new Date(),
          },
        })

        return tx.order.findUnique({
          where: { id: existing.id },
          include: MARKETPLACE_ORDER_INCLUDE,
        })
      })

      if (!updated) return apiError('Pesanan tidak ditemukan', 404)

      void logOrderEvent({
        action: 'marketplace.cancel_request_rejected',
        severity: 'INFO',
        summary: `Penjual tolak pengajuan pembatalan ${existing.orderCode}`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'TEKNISI',
        },
        target: { type: 'marketplace_order', id, label: existing.orderCode },
      })

      return apiSuccess(
        serializeMarketplaceOrder(updated, {
          viewerId: session.user.id,
          viewerRole: 'TEKNISI',
        }),
      )
    }

    if (parsed.data.action === 'set_shipment') {
      if (existing.status !== 'PROCESSING') {
        return apiError('Resi hanya dapat diinput saat pesanan sedang diproses')
      }
      if (!isBinderbyteConfigured()) {
        return apiError('Layanan pelacakan resi belum dikonfigurasi di server', 503)
      }

      const { courier, trackingNumber } = parsed.data

      if (
        existing.checkoutShippingCourier &&
        !binderbyteCourierMatchesEnum(existing.checkoutShippingCourier, courier)
      ) {
        const expectedLabel =
          courierLabelFromBinderbyteCode(existing.checkoutShippingCourier) ??
          existing.checkoutShippingCourier.toUpperCase()
        const serviceHint = existing.shippingService
          ? ` · layanan ${existing.shippingService}`
          : ''
        return apiError(
          `Kurir harus sama dengan pilihan pembeli (${expectedLabel}${serviceHint})`,
          400,
        )
      }

      try {
        await syncOrderTrackingFromBinderbyte({
          orderId: id,
          courier,
          trackingNumber,
          markShipped: true,
        })
      } catch (e) {
        if (e instanceof BinderbyteError) {
          return apiError(e.message, e.code === 'INVALID_AWB' ? 400 : 502)
        }
        throw e
      }

      const updated = await prisma.order.findFirst({
        where: { id },
        include: MARKETPLACE_ORDER_INCLUDE,
      })
      if (!updated) return apiError('Pesanan tidak ditemukan', 404)

      void logOrderEvent({
        action: 'marketplace.shipment_registered',
        severity: 'INFO',
        summary: `Resi ${trackingNumber} (${courier}) — order ${existing.orderCode}`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'TEKNISI',
        },
        target: { type: 'marketplace_order', id, label: existing.orderCode },
      })

      return apiSuccess(
        serializeMarketplaceOrder(updated, {
          viewerId: session.user.id,
          viewerRole: 'TEKNISI',
        }),
      )
    }

    // action: advance — hanya PAID→PROCESSING (SHIPPED→COMPLETED via pembeli/cron)
    if (existing.status === 'PAID') {
      const isPhysical = existing.items.some((i) => i.product.category !== 'SOFTWARE')
      if (isPhysical) {
        const proof = await prisma.orderPackagingProof.findUnique({
          where: { orderId: id },
        })
        if (!proof || proof.status !== 'APPROVED') {
          return apiError(
            'Upload dan tunggu persetujuan bukti packaging terlebih dahulu',
            400,
          )
        }
      }
    }

    if (existing.status === 'PROCESSING') {
      return apiError(
        'Untuk menandai dikirim, input kurir dan nomor resi terlebih dahulu',
      )
    }

    if (existing.status === 'SHIPPED' || existing.status === 'DISPUTED') {
      return apiError(
        'Penyelesaian pesanan ditentukan pembeli setelah paket sampai',
      )
    }

    let nextStatus: OrderStatus | null = null
    if (existing.status === 'PAID') {
      nextStatus = 'PROCESSING'
    } else {
      return apiError('Status pesanan tidak dapat diperbarui')
    }

    const now = new Date()
    const updated = await prisma.order.update({
      where: { id },
      data: { status: nextStatus, processingAt: now },
      include: MARKETPLACE_ORDER_INCLUDE,
    })

    void logOrderEvent({
      action: 'marketplace.status_updated',
      severity: 'INFO',
      summary: `Order ${existing.orderCode} → ${nextStatus}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: 'TEKNISI',
      },
      target: { type: 'marketplace_order', id, label: existing.orderCode },
    })

    return apiSuccess(
      serializeMarketplaceOrder(updated, {
        viewerId: session.user.id,
        viewerRole: 'TEKNISI',
      }),
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_SELLER_BALANCE') {
      return apiError(
        'Saldo Anda tidak cukup untuk membatalkan pesanan ini. Pastikan saldo menutup jumlah yang sudah diterima dari order.',
        400,
      )
    }
    if (e instanceof Error && e.message === 'WALLET_NOT_FOUND') {
      return apiError('Wallet pembeli tidak ditemukan', 400)
    }
    if (e instanceof Error && e.message === 'SELLER_WALLET_NOT_FOUND') {
      return apiError('Wallet penjual tidak ditemukan', 400)
    }
    console.error('[TEKNISI_MARKETPLACE_ORDER_PATCH]', e)
    return apiError('Gagal memperbarui pesanan', 500)
  }
}
