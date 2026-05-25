import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'

export const dynamic = 'force-dynamic'

const includeOrder = {
  teknisi: { select: { id: true, name: true, email: true, image: true } },
  report: true,
  rekber: true,
} as const

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  const { id } = await params
  try {
    const row = await prisma.inspectionOrder.findFirst({
      where: { id, userId: session.user.id },
      include: includeOrder,
    })
    if (!row) return apiError('Inspeksi tidak ditemukan', 404)
    return apiSuccess(serializeInspectionOrder(row, 'USER'))
  } catch (e) {
    console.error('[USER_INSPEKSI_ID_GET]', e)
    return apiError('Gagal memuat detail inspeksi', 500)
  }
}
