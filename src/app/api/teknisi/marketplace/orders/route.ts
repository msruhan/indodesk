import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'

export const dynamic = 'force-dynamic'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const rows = await prisma.order.findMany({
      where: { sellerId: session.user.id },
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
        viewerRole: 'TEKNISI',
      }),
    )

    const stats = {
      total: items.length,
      paid: items.filter((i) => i.status === 'paid').length,
      processing: items.filter((i) => i.status === 'processing').length,
      shipped: items.filter((i) => i.status === 'shipped').length,
      completed: items.filter((i) => i.status === 'completed').length,
    }

    return apiSuccess({ items, stats })
  } catch (e) {
    console.error('[TEKNISI_MARKETPLACE_ORDERS_GET]', e)
    return apiError('Gagal memuat pesanan', 500)
  }
}
