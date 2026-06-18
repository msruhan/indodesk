import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeOrderComplaint } from '@/lib/marketplace-order-complaint-serializer'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.orderComplaint.findUnique({
      where: { id },
      include: {
        media: true,
        order: { select: { orderCode: true, total: true, status: true, id: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    })
    if (!row) return apiError('Komplain tidak ditemukan', 404)

    return apiSuccess({
      ...serializeOrderComplaint(row),
      orderId: row.order.id,
      orderCode: row.order.orderCode,
      orderTotal: Number(row.order.total),
      orderStatus: row.order.status,
      buyerName: row.buyer.name,
      buyerEmail: row.buyer.email,
      sellerName: row.seller.name,
      sellerEmail: row.seller.email,
    })
  } catch (e) {
    console.error('[ADMIN_COMPLAINT_GET]', e)
    return apiError('Gagal memuat detail komplain', 500)
  }
}
