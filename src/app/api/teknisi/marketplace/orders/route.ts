import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'

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
      include: MARKETPLACE_ORDER_INCLUDE,
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
      disputed: items.filter((i) => i.status === 'disputed').length,
      completed: items.filter((i) => i.status === 'completed').length,
    }

    return apiSuccess({ items, stats })
  } catch (e) {
    console.error('[TEKNISI_MARKETPLACE_ORDERS_GET]', e)
    return apiError('Gagal memuat pesanan', 500)
  }
}
