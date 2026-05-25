import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'

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
      include: {
        buyer: { select: PARTY_SELECT },
        seller: { select: PARTY_SELECT },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const items = rows.map((r) =>
      serializeMarketplaceOrder(r, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
      }),
    )

    return apiSuccess(items)
  } catch (e) {
    console.error('[USER_MARKETPLACE_ORDERS_GET]', e)
    return apiError('Gagal memuat pesanan', 500)
  }
}
