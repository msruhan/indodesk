import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializeTopupCatalog } from '@/lib/topup-catalog-serializer'
import { topupCategories } from '@/data/mock-topup'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const products = await prisma.topupCatalogProduct.findMany({
      where: { isActive: true },
      include: {
        denominations: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const catalog = serializeTopupCatalog(products)
    const categorySlugs = new Set(products.map((p) => p.category))
    const categories = topupCategories.filter((c) => categorySlugs.has(c.slug))
    return apiSuccess({
      categories: categories.length > 0 ? categories : topupCategories,
      ...catalog,
    })
  } catch (e) {
    console.error('[TOPUP_CATALOG_GET]', e)
    return apiError('Gagal memuat katalog topup', 500)
  }
}
