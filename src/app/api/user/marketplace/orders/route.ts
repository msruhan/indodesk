import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import { loadSellerReturnAddressMap } from '@/lib/marketplace-complaint-return'

export const dynamic = 'force-dynamic'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const rows = await prisma.order.findMany({
      where: { buyerId: session.user.id },
      include: MARKETPLACE_ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })

    const orderIds = rows.map((r) => r.id)
    const reviewRows =
      orderIds.length > 0
        ? await prisma.productReview.findMany({
            where: { orderId: { in: orderIds }, authorId: session.user.id },
            select: { orderId: true, productId: true },
          })
        : []

    const reviewedByOrder = new Map<string, string[]>()
    for (const rev of reviewRows) {
      const list = reviewedByOrder.get(rev.orderId) ?? []
      list.push(rev.productId)
      reviewedByOrder.set(rev.orderId, list)
    }

    const returnSellerIds = rows
      .filter((r) => r.complaint?.status === 'AWAITING_RETURN')
      .map((r) => r.sellerId)
    const returnAddressMap = await loadSellerReturnAddressMap(returnSellerIds)

    const items = rows.map((r) =>
      serializeMarketplaceOrder(r, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
        reviewedProductIds: reviewedByOrder.get(r.id) ?? [],
        sellerReturnAddress:
          r.complaint?.status === 'AWAITING_RETURN'
            ? (returnAddressMap.get(r.sellerId) ?? null)
            : null,
      }),
    )

    return apiSuccess(items)
  } catch (e) {
    console.error('[USER_MARKETPLACE_ORDERS_GET]', e)
    return apiError('Gagal memuat pesanan', 500)
  }
}
