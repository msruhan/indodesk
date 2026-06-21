import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import {
  serializePublicStoreDetail,
  type PublicStoreProductDto,
} from '@/lib/teknisi-store-serializer'
import { PUBLIC_MARKETPLACE_PRODUCT_WHERE } from '@/lib/public-marketplace-product'

export const dynamic = 'force-dynamic'

/** Halaman publik toko — hanya toko disetujui & dipublikasikan. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const store = await prisma.teknisiStore.findFirst({
      where: {
        id,
        listingStatus: 'APPROVED',
        isPublished: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            teknisiProfile: {
              select: {
                rating: true,
                reviewCount: true,
                description: true,
                specialty: true,
                experience: true,
                isOnline: true,
                isVerified: true,
                totalKonsultasi: true,
                totalView: true,
                price: true,
              },
            },
          },
        },
      },
    })

    if (!store) {
      return apiError('Toko tidak ditemukan atau belum dipublikasikan', 404)
    }

    void prisma.teknisiStore.update({
      where: { id: store.id },
      data: { profileViews: { increment: 1 } },
    }).catch(() => {})

    const products = await prisma.product.findMany({
      where: {
        sellerId: store.userId,
        ...PUBLIC_MARKETPLACE_PRODUCT_WHERE,
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
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

    return apiSuccess(
      serializePublicStoreDetail(
        store,
        store.user.teknisiProfile,
        store.user.id,
        productDtos,
        {
          name: store.user.name,
          image: store.user.image,
        },
      ),
    )
  } catch (e) {
    console.error('[PUBLIC_STORE_GET]', e)
    return apiError('Gagal memuat toko', 500)
  }
}
