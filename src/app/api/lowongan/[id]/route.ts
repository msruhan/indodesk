import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializePublicLowonganDetail } from '@/lib/lowongan-serializer'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const row = await prisma.lowongan.findFirst({
      where: { id, isActive: true },
    })
    if (!row) return apiError('Lowongan tidak ditemukan', 404)

    const applicants = await prisma.lowonganApplication.count({
      where: { lowonganId: id },
    })

    return apiSuccess(serializePublicLowonganDetail(row, applicants))
  } catch (e) {
    console.error('[LOWONGAN_DETAIL_GET]', e)
    return apiError('Gagal memuat detail lowongan', 500)
  }
}
