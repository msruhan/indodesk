import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { serializeTopupOrder } from '@/lib/topup-order-serializer'

export const dynamic = 'force-dynamic'

/** GET /api/user/topup/orders — daftar order top up user yang login */
export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const rows = await prisma.topupOrder.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    if (rows.length === 0) return apiSuccess([])

    const slugs = [...new Set(rows.map((r) => r.productSlug))]
    const skus = [...new Set(rows.map((r) => r.denominationSku))]

    const [products, denominations] = await Promise.all([
      prisma.topupCatalogProduct.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, name: true, logo: true },
      }),
      prisma.topupDenomination.findMany({
        where: { sku: { in: skus } },
        select: { sku: true, label: true },
      }),
    ])

    const productBySlug = new Map(products.map((p) => [p.slug, p]))
    const denomBySku = new Map(denominations.map((d) => [d.sku, d]))

    const items = rows.map((order) => {
      const product = productBySlug.get(order.productSlug) ?? null
      const denomination = denomBySku.get(order.denominationSku) ?? null
      return serializeTopupOrder(
        { ...order, product, denomination },
        product?.name,
        denomination?.label,
      )
    })

    return apiSuccess(items)
  } catch (e) {
    console.error('[USER_TOPUP_ORDERS_GET]', e)
    return apiError('Gagal memuat order top up', 500)
  }
}
