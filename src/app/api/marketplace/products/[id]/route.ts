import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { getTeknisiResponseTimeLabel } from '@/lib/teknisi-platform-stats'
import { serializeMarketplaceProduct } from '@/lib/marketplace-product-serializer'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const product = await prisma.product.findFirst({
      where: {
        id,
        isActive: true,
        isPublished: true,
        listingStatus: 'APPROVED',
      },
      include: {
        seller: {
          include: {
            teknisiProfile: true,
            teknisiStore: true,
          },
        },
      },
    })

    if (!product) return apiError('Produk tidak ditemukan', 404)

    await prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    const responseTime = await getTeknisiResponseTimeLabel(product.seller.id)

    return apiSuccess(serializeMarketplaceProduct(product, responseTime))
  } catch (e) {
    console.error('[MARKETPLACE_PRODUCT_GET]', e)
    return apiError('Gagal mengambil produk', 500)
  }
}
