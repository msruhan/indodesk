import { z } from 'zod'
import { OrderStatus, ShippingCourier } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { BinderbyteError, isBinderbyteConfigured } from '@/lib/binderbyte-client'
import { logOrderEvent } from '@/lib/activity-log'
import { syncOrderTrackingFromBinderbyte } from '@/lib/order-tracking-sync'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import {
  debitSellerForMarketplace,
  ensureMarketplaceOrderSettlement,
  refundBuyerForMarketplace,
} from '@/lib/marketplace-wallet'

export const dynamic = 'force-dynamic'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

const courierEnum = z.nativeEnum(ShippingCourier)

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
  }),
])

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
      include: {
        buyer: { select: PARTY_SELECT },
        seller: { select: PARTY_SELECT },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    })
    if (!existing) return apiError('Pesanan tidak ditemukan', 404)

    if (parsed.data.action === 'cancel') {
      if (existing.status !== 'PAID' && existing.status !== 'PROCESSING') {
        return apiError('Hanya pesanan dibayar atau diproses yang bisa dibatalkan')
      }

      const alreadyRefunded = await prisma.walletLedger.findFirst({
        where: {
          type: 'REFUND',
          referenceId: id,
          wallet: { userId: existing.buyerId },
        },
      })
      if (alreadyRefunded) {
        return apiError('Pesanan ini sudah dibatalkan / direfund')
      }

      const updated = await prisma.$transaction(async (tx) => {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              soldCount: { decrement: item.quantity },
            },
          })
        }

        await refundBuyerForMarketplace(
          tx,
          existing.buyerId,
          existing.total,
          id,
          `Refund pembatalan order ${existing.orderCode}`,
        )
        await debitSellerForMarketplace(
          tx,
          existing.sellerId,
          existing.total,
          id,
          `Pembatalan penjualan ${existing.orderCode}`,
        )

        return tx.order.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            trackingActive: false,
            trackingNextSyncAt: null,
          },
          include: {
            buyer: { select: PARTY_SELECT },
            seller: { select: PARTY_SELECT },
            items: { include: { product: { select: { id: true, name: true } } } },
          },
        })
      })

      void logOrderEvent({
        action: 'marketplace.cancelled',
        severity: 'WARNING',
        summary: `Order ${existing.orderCode} dibatalkan — refund ke pembeli`,
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
        include: {
          buyer: { select: PARTY_SELECT },
          seller: { select: PARTY_SELECT },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
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

    // action: advance — PAID→PROCESSING atau SHIPPED→COMPLETED saja (bukan PROCESSING→SHIPPED)
    if (existing.status === 'PROCESSING') {
      return apiError(
        'Untuk menandai dikirim, input kurir dan nomor resi terlebih dahulu',
      )
    }

    let nextStatus: OrderStatus | null = null
    switch (existing.status) {
      case 'PAID':
        nextStatus = 'PROCESSING'
        break
      case 'SHIPPED':
        nextStatus = 'COMPLETED'
        break
      default:
        return apiError('Status pesanan tidak dapat diperbarui')
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(nextStatus === 'COMPLETED' ? { trackingActive: false, trackingNextSyncAt: null } : {}),
      },
      include: {
        buyer: { select: PARTY_SELECT },
        seller: { select: PARTY_SELECT },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    })

    if (nextStatus === 'COMPLETED') {
      try {
        await ensureMarketplaceOrderSettlement(id)
      } catch (e) {
        if (!(e instanceof Error && e.message === 'INSUFFICIENT_BALANCE')) {
          throw e
        }
      }
    }

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
