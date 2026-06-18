import { prisma } from '@/lib/db'
import { apiError, apiSuccess, getApiSession } from '@/lib/api-auth'
import { maybeAdvanceTopupFulfillment } from '@/lib/topup-checkout'
import { serializeTopupOrder } from '@/lib/topup-order-serializer'
import { hashTopupPollToken } from '@/lib/topup-poll-token'
import { getClientIp, RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

function isAuthorized(
  order: { userId: string | null; pollTokenHash: string | null },
  sessionUserId: string | undefined,
  pollToken: string | null,
): boolean {
  if (sessionUserId && order.userId === sessionUserId) return true
  if (pollToken && order.pollTokenHash && hashTopupPollToken(pollToken) === order.pollTokenHash) {
    return true
  }
  return false
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderCode: string }> },
) {
  const ip = getClientIp(req)
  const rl = await withRateLimit(req, ['topup', 'order-poll', ip], RATE_LIMITS.auth)
  if (!rl.allowed) return rateLimitResponse(rl, { req, key: `topup:poll:${ip}` })

  const { orderCode } = await params
  const code = orderCode.trim().toUpperCase()
  if (!code) return apiError('Kode order wajib diisi')

  const pollToken = new URL(req.url).searchParams.get('token')?.trim() || null
  const session = await getApiSession()

  try {
    let order = await prisma.topupOrder.findUnique({
      where: { orderCode: code },
    })
    if (!order) return apiError('Order tidak ditemukan', 404)

    if (!isAuthorized(order, session?.user?.id, pollToken)) {
      return apiError('Akses ditolak. Login sebagai pemilik order atau gunakan kode akses.', 403, {
        code: 'TOPUP_POLL_FORBIDDEN',
      })
    }

    if (order.paidAt && order.status !== 'COMPLETED' && order.status !== 'FAILED') {
      const advanced = await maybeAdvanceTopupFulfillment(order.id)
      if (advanced) order = advanced
    }

    const [product, denomination] = await Promise.all([
      prisma.topupCatalogProduct.findUnique({
        where: { slug: order.productSlug },
        select: { name: true, logo: true, slug: true },
      }),
      prisma.topupDenomination.findUnique({
        where: { sku: order.denominationSku },
        select: { label: true },
      }),
    ])

    return apiSuccess(
      serializeTopupOrder(
        { ...order, product, denomination },
        product?.name,
        denomination?.label,
      ),
    )
  } catch (e) {
    console.error('[TOPUP_ORDER_GET]', e)
    return apiError('Gagal memuat order', 500)
  }
}
