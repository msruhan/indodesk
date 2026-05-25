import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializePublicLowongan } from '@/lib/lowongan-serializer'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await prisma.lowongan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const ids = rows.map((r) => r.id)
    const grouped =
      ids.length === 0
        ? []
        : await prisma.lowonganApplication.groupBy({
            by: ['lowonganId'],
            where: { lowonganId: { in: ids } },
            _count: { _all: true },
          })
    const counts = new Map(grouped.map((g) => [g.lowonganId, g._count._all]))

    return apiSuccess(rows.map((r) => serializePublicLowongan(r, counts.get(r.id) ?? 0)))
  } catch (e) {
    console.error('[LOWONGAN_GET]', e)
    return apiError('Gagal memuat lowongan', 500)
  }
}
