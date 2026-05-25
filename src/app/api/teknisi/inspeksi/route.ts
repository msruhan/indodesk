import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'

export const dynamic = 'force-dynamic'

const includeOrder = {
  user: { select: { id: true, name: true, email: true, image: true } },
  teknisi: { select: { id: true, name: true, email: true, image: true } },
  report: true,
} as const

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const rows = await prisma.inspectionOrder.findMany({
      where: { teknisiId: session.user.id },
      include: includeOrder,
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(rows.map((r) => serializeInspectionOrder(r, 'TEKNISI')))
  } catch (e) {
    console.error('[TEKNISI_INSPEKSI_GET]', e)
    return apiError('Gagal memuat inspeksi', 500)
  }
}
