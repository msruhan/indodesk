import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { requireEmailVerifiedUser } from '@/lib/require-email-verified'
import { RATE_LIMITS, rateLimitResponse, withRateLimit } from '@/lib/rate-limit-store'
import { createTripayPaymentIntent } from '@/lib/payments/create-tripay-payment'
import {
  CATALOG_TOPUP_PAYMENT_TTL_MS,
  MARKETPLACE_PAYMENT_TTL_MS,
  WALLET_TOPUP_MAX,
  WALLET_TOPUP_MIN,
} from '@/lib/payments/payment-intent'
import { getTripayConfig } from '@/lib/tripay/config'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const channelFields = {
  channelCode: z.string().min(2).max(32),
}

const createSchema = z.discriminatedUnion('purpose', [
  z.object({
    purpose: z.literal('WALLET_TOPUP'),
    ...channelFields,
    subtotal: z.number().int().min(WALLET_TOPUP_MIN).max(WALLET_TOPUP_MAX),
  }),
  z.object({
    purpose: z.literal('KONSULTASI'),
    ...channelFields,
    targetId: z.string().min(1),
  }),
  z.object({
    purpose: z.literal('MARKETPLACE'),
    ...channelFields,
    targetId: z.string().min(1),
  }),
  z.object({
    purpose: z.literal('CATALOG_TOPUP'),
    ...channelFields,
    targetId: z.string().min(1),
  }),
])

/** POST /api/payments/tripay/create — create Tripay payment intent */
export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const emailGate = await requireEmailVerifiedUser(session.user.id)
  if (!emailGate.ok) return emailGate.error

  const rl = await withRateLimit(req, ['tripay', 'create', session.user.id], RATE_LIMITS.walletTopup)
  if (!rl.allowed) return rateLimitResponse(rl)

  const cfg = getTripayConfig()
  if (!cfg.isConfigured) {
    return apiError('Payment gateway belum dikonfigurasi', 503)
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message)
    }

    const origin = new URL(req.url).origin
    const { purpose, channelCode } = parsed.data

    if (purpose === 'WALLET_TOPUP') {
      const intent = await createTripayPaymentIntent({
        purpose,
        userId: session.user.id,
        channelCode,
        subtotal: parsed.data.subtotal,
        orderItemName: 'Topup Saldo Bantoo',
        returnUrlBase: origin,
        expiredTimeSeconds: 24 * 60 * 60,
      })
      return apiSuccess(intent, 201)
    }

    if (purpose === 'KONSULTASI') {
      const { targetId } = parsed.data
      const konsultasi = await prisma.konsultasiSession.findFirst({
        where: { id: targetId, userId: session.user.id },
      })
      if (!konsultasi) return apiError('Konsultasi tidak ditemukan', 404)
      if (konsultasi.status !== 'AWAITING_PAYMENT') {
        return apiError('Konsultasi tidak menunggu pembayaran')
      }
      if (konsultasi.paymentMethod !== 'PAYMENT_GATEWAY') {
        return apiError('Metode pembayaran tidak valid')
      }

      const subtotal = Number(konsultasi.price.toString())
      if (!Number.isInteger(subtotal) || subtotal <= 0) {
        return apiError('Harga konsultasi tidak valid')
      }

      await prisma.paymentIntent.updateMany({
        where: { purpose: 'KONSULTASI', targetId, status: 'UNPAID' },
        data: { status: 'EXPIRED' },
      })

      const intent = await createTripayPaymentIntent({
        purpose,
        userId: session.user.id,
        channelCode,
        subtotal,
        targetId,
        orderItemName: `Konsultasi: ${konsultasi.service}`,
        returnUrlBase: origin,
        onBeforeCreate: async (merchantRef) => {
          await prisma.konsultasiSession.update({
            where: { id: targetId },
            data: { pgProvider: 'tripay', pgExternalRef: merchantRef },
          })
        },
      })

      await prisma.konsultasiSession.update({
        where: { id: targetId },
        data: { paymentExpiresAt: intent.expiredAt ? new Date(intent.expiredAt) : undefined },
      })

      return apiSuccess(intent, 201)
    }

    if (purpose === 'CATALOG_TOPUP') {
      const orderId = parsed.data.targetId
      const topupOrder = await prisma.topupOrder.findFirst({
        where: { id: orderId, userId: session.user.id },
      })
      if (!topupOrder) return apiError('Order topup tidak ditemukan', 404)
      if (topupOrder.status !== 'PENDING_PAYMENT') {
        return apiError('Order tidak menunggu pembayaran')
      }

      const subtotal = Number(topupOrder.total.toString())
      if (!Number.isInteger(subtotal) || subtotal <= 0) {
        return apiError('Total pembayaran tidak valid')
      }

      await prisma.paymentIntent.updateMany({
        where: { purpose: 'CATALOG_TOPUP', targetId: orderId, status: 'UNPAID' },
        data: { status: 'EXPIRED' },
      })

      const catalogProduct = await prisma.topupCatalogProduct.findFirst({
        where: { slug: topupOrder.productSlug },
        select: { name: true },
      })
      const productName = catalogProduct?.name ?? topupOrder.productSlug
      const intent = await createTripayPaymentIntent({
        purpose: 'CATALOG_TOPUP',
        userId: session.user.id,
        channelCode,
        subtotal,
        targetId: orderId,
        orderItemName: `Top Up ${productName}`,
        returnUrlBase: origin,
        expiredTimeSeconds: Math.floor(CATALOG_TOPUP_PAYMENT_TTL_MS / 1000),
        onBeforeCreate: async (merchantRef) => {
          await prisma.topupOrder.update({
            where: { id: orderId },
            data: { pgProvider: 'tripay', pgExternalRef: merchantRef },
          })
        },
      })

      await prisma.topupOrder.update({
        where: { id: orderId },
        data: {
          paymentExpiresAt: intent.expiredAt ? new Date(intent.expiredAt) : undefined,
        },
      })

      return apiSuccess({ ...intent, orderCode: topupOrder.orderCode }, 201)
    }

    if (purpose !== 'MARKETPLACE') {
      return apiError('Purpose tidak valid')
    }

    const checkoutBatchId = parsed.data.targetId
    const orders = await prisma.order.findMany({
      where: {
        checkoutBatchId,
        buyerId: session.user.id,
        status: 'AWAITING_PAYMENT',
      },
    })
    if (orders.length === 0) {
      return apiError('Pesanan tidak ditemukan atau sudah dibayar', 404)
    }

    const subtotal = orders.reduce((sum, o) => sum + Number(o.buyerHoldAmount.toString()), 0)
    if (!Number.isInteger(subtotal) || subtotal <= 0) {
      return apiError('Total pembayaran tidak valid')
    }

    await prisma.paymentIntent.updateMany({
      where: { purpose: 'MARKETPLACE', targetId: checkoutBatchId, status: 'UNPAID' },
      data: { status: 'EXPIRED' },
    })

    const intent = await createTripayPaymentIntent({
      purpose: 'MARKETPLACE',
      userId: session.user.id,
      channelCode,
      subtotal,
      targetId: checkoutBatchId,
      orderItemName: `Marketplace Bantoo (${orders.length} pesanan)`,
      returnUrlBase: origin,
      expiredTimeSeconds: Math.floor(MARKETPLACE_PAYMENT_TTL_MS / 1000),
      onBeforeCreate: async (merchantRef) => {
        await prisma.order.updateMany({
          where: { checkoutBatchId, status: 'AWAITING_PAYMENT' },
          data: { pgProvider: 'tripay', pgExternalRef: merchantRef },
        })
      },
    })

    await prisma.order.updateMany({
      where: { checkoutBatchId, status: 'AWAITING_PAYMENT' },
      data: {
        paymentExpiresAt: intent.expiredAt ? new Date(intent.expiredAt) : undefined,
      },
    })

    return apiSuccess(intent, 201)
  } catch (e) {
    console.error('[TRIPAY_CREATE]', e)
    const msg = e instanceof Error ? e.message : 'Gagal membuat pembayaran'
    if (msg === 'TRIPAY_NOT_CONFIGURED') {
      return apiError('Payment gateway belum dikonfigurasi', 503)
    }
    return apiError(msg.includes('Tripay') ? msg : 'Gagal membuat transaksi pembayaran', 502)
  }
}
