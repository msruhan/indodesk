import { prisma } from '@/lib/db'
import { requireApiRole, apiSuccess, apiError } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const result = await requireApiRole(['TEKNISI'])
  if (result.error) return result.error
  const { session } = result

  try {
    const products = await prisma.product.findMany({
      where: { sellerId: session.user.id, isActive: true },
      orderBy: { views: 'desc' },
      select: {
        id: true,
        name: true,
        image: true,
        category: true,
        price: true,
        views: true,
        soldCount: true,
        stock: true,
        isPublished: true,
        listingStatus: true,
        createdAt: true,
        orderItems: {
          select: { quantity: true },
        },
      },
    })

    const analytics = products.map((p) => {
      const totalOrdered = p.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const conversionRate = p.views > 0 ? ((totalOrdered / p.views) * 100).toFixed(1) : '0'
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category,
        price: Number(p.price),
        views: p.views,
        soldCount: p.soldCount,
        totalOrdered,
        stock: p.stock,
        conversionRate: parseFloat(conversionRate),
        isPublished: p.isPublished,
        listingStatus: p.listingStatus,
        createdAt: p.createdAt.toISOString(),
      }
    })

    const summary = {
      totalProducts: analytics.length,
      totalViews: analytics.reduce((s, p) => s + p.views, 0),
      totalSold: analytics.reduce((s, p) => s + p.soldCount, 0),
      totalOrdered: analytics.reduce((s, p) => s + p.totalOrdered, 0),
    }

    return apiSuccess({ summary, products: analytics })
  } catch (e) {
    console.error('[TEKNISI_PRODUCT_ANALYTICS]', e)
    return apiError('Gagal memuat analitik produk', 500)
  }
}
