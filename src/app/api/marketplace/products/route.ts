import { ProductCategory } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { MARKETPLACE_CATEGORY_SLUGS } from '@/lib/product-category-config'
import { serializeMarketplaceProducts } from '@/lib/marketplace-product-serializer'
import { PUBLIC_MARKETPLACE_PRODUCT_WHERE } from '@/lib/public-marketplace-product'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')?.trim()
    const slug = category && category !== 'all' ? category.toLowerCase() : undefined
    const categoryFilters: ProductCategory[] | undefined = slug
      ? MARKETPLACE_CATEGORY_SLUGS[slug]
      : undefined

    const products = await prisma.product.findMany({
      where: {
        ...PUBLIC_MARKETPLACE_PRODUCT_WHERE,
        ...(categoryFilters?.length ? { category: { in: categoryFilters } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { seller: { name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        seller: {
          include: {
            teknisiProfile: true,
            teknisiStore: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(await serializeMarketplaceProducts(products))
  } catch (e) {
    console.error('[MARKETPLACE_PRODUCTS_GET]', e)
    return apiError('Gagal memuat produk', 500)
  }
}
