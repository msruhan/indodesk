import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { buildRekberStats, serializeRekber } from '@/lib/rekber-serializer'
import { REKBER_INCLUDE } from '@/lib/rekber-includes'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const rows = await prisma.rekberTransaction.findMany({
      include: REKBER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })

    const items = rows.map((r) =>
      serializeRekber(r, { viewerId: session.user.id, viewerRole: 'ADMIN' }),
    )

    return apiSuccess({ items, stats: buildRekberStats(items) })
  } catch (e) {
    console.error('[ADMIN_REKBER_GET]', e)
    return apiError('Gagal memuat rekber', 500)
  }
}
