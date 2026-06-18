import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { loadReturnTracking } from '@/lib/return-tracking-sync'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const complaint = await prisma.orderComplaint.findFirst({
      where: { orderId: id, buyerId: session.user.id },
      select: { id: true },
    })
    if (!complaint) return apiError('Komplain tidak ditemukan', 404)

    const tracking = await loadReturnTracking(complaint.id)
    return apiSuccess({ tracking })
  } catch (e) {
    console.error('[USER_MARKETPLACE_RETURN_TRACKING]', e)
    return apiError('Gagal memuat tracking retur', 500)
  }
}
