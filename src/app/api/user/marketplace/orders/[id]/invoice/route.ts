import { prisma } from '@/lib/db'
import { apiError, requireApiAuth } from '@/lib/api-auth'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import { getPlatformSettings } from '@/lib/platform-settings'
import { buildMarketplaceOrderInvoice } from '@/lib/marketplace-order-invoice'
import { generateMarketplaceOrderInvoicePdf } from '@/lib/marketplace-order-invoice-pdf'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.order.findFirst({
      where: { id, buyerId: session.user.id },
      include: MARKETPLACE_ORDER_INCLUDE,
    })

    if (!row) return apiError('Pesanan tidak ditemukan', 404)

    const platformSettings = await getPlatformSettings()
    const orderDto = serializeMarketplaceOrder(row, {
      viewerId: session.user.id,
      viewerRole: session.user.role,
      buyerFlatFeePerItem: platformSettings.buyerFlatFeePerItem,
    })

    const invoice = buildMarketplaceOrderInvoice(orderDto, {
      platformName: platformSettings.platformName,
      paymentMethod: row.paymentMethod,
      pgProvider: row.pgProvider,
    })

    const pdf = await generateMarketplaceOrderInvoicePdf(invoice)
    const filename = `invoice-${row.orderCode}.pdf`

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[USER_MARKETPLACE_ORDER_INVOICE]', e)
    return apiError('Gagal membuat invoice PDF', 500)
  }
}
