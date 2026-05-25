import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { buildRekberStats, serializeRekber, type RekberParty } from '@/lib/rekber-serializer'

export const dynamic = 'force-dynamic'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof RekberParty, true>

export async function GET() {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const rows = await prisma.rekberTransaction.findMany({
      include: {
        buyer: { select: PARTY_SELECT },
        seller: { select: PARTY_SELECT },
      },
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
