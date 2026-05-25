import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializeTopupCatalog, serializeTopupProduct } from '@/lib/topup-catalog-serializer'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  try {
    const product = await prisma.topupCatalogProduct.findFirst({
      where: { slug, isActive: true },
      include: {
        denominations: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    if (!product) return apiError('Produk topup tidak ditemukan', 404)

    const catalog = serializeTopupCatalog([product])
    return apiSuccess({
      product: catalog.products[0],
      denominations: catalog.denominations,
    })
  } catch (e) {
    console.error('[TOPUP_PRODUCT_GET]', e)
    return apiError('Gagal memuat produk topup', 500)
  }
}
