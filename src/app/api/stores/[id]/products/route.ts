import { ProductCategory } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { MARKETPLACE_CATEGORY_SLUGS } from '@/lib/product-category-config'
import type { PublicStoreProductDto } from '@/lib/teknisi-store-serializer'
import { PUBLIC_MARKETPLACE_PRODUCT_WHERE } from '@/lib/public-marketplace-product'

export const dynamic = 'force-dynamic'

/** Daftar lengkap produk publik milik toko (untuk halaman "Lihat semua"). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const category = url.searchParams.get('category') ?? undefined

  try {
    const store = await prisma.teknisiStore.findFirst({
      where: { id, listingStatus: 'APPROVED', isPublished: true },
      select: { id: true, name: true, userId: true, coverImage: true, city: true },
    })

    if (!store) {
      return apiError('Toko tidak ditemukan atau belum dipublikasikan', 404)
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: store.userId,
        ...PUBLIC_MARKETPLACE_PRODUCT_WHERE,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(category && category !== 'all'
          ? {
              category: {
                in:
                  MARKETPLACE_CATEGORY_SLUGS[category.toLowerCase()] ??
                  ([category.toUpperCase()] as ProductCategory[]),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        category: true,
      },
    })

    const productDtos: PublicStoreProductDto[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.image,
      category: p.category,
    }))

    return apiSuccess({
      store: {
        id: store.id,
        name: store.name,
        coverImage: store.coverImage,
        city: store.city,
      },
      products: productDtos,
      total: productDtos.length,
    })
  } catch (e) {
    console.error('[PUBLIC_STORE_PRODUCTS]', e)
    return apiError('Gagal memuat produk toko', 500)
  }
}
