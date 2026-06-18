import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'
import { INSPECTION_USER_ORDER_INCLUDE } from '@/lib/inspection-includes'
import { disputeInspectionSchema } from '@/lib/validations/inspection'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = disputeInspectionSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    const existing = await prisma.inspectionOrder.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return apiError('Inspeksi tidak ditemukan', 404)
    if (existing.status !== 'REPORT_SUBMITTED') {
      return apiError('Hanya laporan yang sudah dikirim bisa disengketakan')
    }

    const updated = await prisma.inspectionOrder.update({
      where: { id },
      data: {
        status: 'DISPUTED',
        cancelReason: parsed.data.reason.trim(),
      },
      include: INSPECTION_USER_ORDER_INCLUDE,
    })

    return apiSuccess(serializeInspectionOrder(updated, 'USER'))
  } catch (e) {
    console.error('[USER_INSPEKSI_DISPUTE]', e)
    return apiError('Gagal mengajukan sengketa', 500)
  }
}
