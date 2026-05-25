import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { loadOrderTracking } from '@/lib/order-tracking-sync'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const order = await prisma.order.findFirst({
      where: { id, sellerId: session.user.id },
      select: { id: true },
    })
    if (!order) return apiError('Pesanan tidak ditemukan', 404)

    const tracking = await loadOrderTracking(id)
    if (!tracking) {
      return apiSuccess({ tracking: null })
    }

    return apiSuccess({ tracking })
  } catch (e) {
    console.error('[TEKNISI_ORDER_TRACKING_GET]', e)
    return apiError('Gagal memuat pelacakan', 500)
  }
}
