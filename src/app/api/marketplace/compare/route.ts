import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { runBenchmark } from '@/lib/product-benchmark'
import { isBenchmarkable, toBenchmarkInput } from '@/lib/benchmark-serializer'
import { PUBLIC_MARKETPLACE_PRODUCT_WHERE } from '@/lib/public-marketplace-product'

export const dynamic = 'force-dynamic'

/**
 * GET /api/marketplace/compare?a={id}&b={id}
 * Bandingkan 2 produk dan return hasil benchmark terukur.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const idA = searchParams.get('a')
  const idB = searchParams.get('b')

  if (!idA || !idB) {
    return apiError('Parameter a & b wajib diisi', 400)
  }
  if (idA === idB) {
    return apiError('Tidak bisa membandingkan produk yang sama', 400)
  }

  try {
    const [productA, productB] = await Promise.all([
      prisma.product.findFirst({
        where: { id: idA, ...PUBLIC_MARKETPLACE_PRODUCT_WHERE },
        include: { seller: { include: { teknisiProfile: true, teknisiStore: true } } },
      }),
      prisma.product.findFirst({
        where: { id: idB, ...PUBLIC_MARKETPLACE_PRODUCT_WHERE },
        include: { seller: { include: { teknisiProfile: true, teknisiStore: true } } },
      }),
    ])

    if (!productA || !productB) {
      return apiError('Salah satu produk tidak ditemukan', 404)
    }

    if (!isBenchmarkable(productA.category) || !isBenchmarkable(productB.category)) {
      return apiError('Kategori produk tidak mendukung perbandingan', 400)
    }

    if (productA.category !== productB.category) {
      return apiError(
        'Hanya bisa membandingkan produk dengan kategori yang sama',
        400,
      )
    }

    const inputA = toBenchmarkInput(productA)
    const inputB = toBenchmarkInput(productB)
    const result = runBenchmark(inputA, inputB)

    return apiSuccess({
      productA: {
        id: productA.id,
        name: productA.name,
        image: inputA.image,
        price: inputA.price,
        category: productA.category,
        deviceType: productA.deviceType,
        storeName: productA.seller.teknisiStore?.name ?? productA.seller.name,
      },
      productB: {
        id: productB.id,
        name: productB.name,
        image: inputB.image,
        price: inputB.price,
        category: productB.category,
        deviceType: productB.deviceType,
        storeName: productB.seller.teknisiStore?.name ?? productB.seller.name,
      },
      result,
    })
  } catch (e) {
    console.error('[MARKETPLACE_COMPARE_GET]', e)
    return apiError('Gagal membandingkan produk', 500)
  }
}
