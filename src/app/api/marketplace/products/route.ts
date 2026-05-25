import { ProductCategory } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializeMarketplaceProduct } from '@/lib/marketplace-product-serializer'

export const dynamic = 'force-dynamic'

const categoryFromSlug: Record<string, ProductCategory> = {
  handphone: 'HANDPHONE',
  laptop: 'LAPTOP',
  aksesoris: 'AKSESORIS',
  software: 'SOFTWARE',
  lainnya: 'LAINNYA',
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')?.trim()
    const categoryFilter =
      category && category !== 'all' ? categoryFromSlug[category.toLowerCase()] : undefined

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isPublished: true,
        listingStatus: 'APPROVED',
        ...(categoryFilter ? { category: categoryFilter } : {}),
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

    return apiSuccess(products.map(serializeMarketplaceProduct))
  } catch (e) {
    console.error('[MARKETPLACE_PRODUCTS_GET]', e)
    return apiError('Gagal memuat produk', 500)
  }
}
