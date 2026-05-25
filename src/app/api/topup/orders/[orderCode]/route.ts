import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { maybeAdvanceTopupFulfillment } from '@/lib/topup-checkout'
import { serializeTopupOrder } from '@/lib/topup-order-serializer'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderCode: string }> },
) {
  const { orderCode } = await params
  const code = orderCode.trim().toUpperCase()
  if (!code) return apiError('Kode order wajib diisi')

  try {
    let order = await prisma.topupOrder.findUnique({
      where: { orderCode: code },
    })
    if (!order) return apiError('Order tidak ditemukan', 404)

    if (order.paidAt && order.status !== 'COMPLETED' && order.status !== 'FAILED') {
      const advanced = await maybeAdvanceTopupFulfillment(order.id)
      if (advanced) order = advanced
    }

    const [product, denomination] = await Promise.all([
      prisma.topupCatalogProduct.findUnique({
        where: { slug: order.productSlug },
        select: { name: true, logo: true, slug: true },
      }),
      prisma.topupDenomination.findUnique({
        where: { sku: order.denominationSku },
        select: { label: true },
      }),
    ])

    return apiSuccess(
      serializeTopupOrder(
        { ...order, product, denomination },
        product?.name,
        denomination?.label,
      ),
    )
  } catch (e) {
    console.error('[TOPUP_ORDER_GET]', e)
    return apiError('Gagal memuat order', 500)
  }
}
