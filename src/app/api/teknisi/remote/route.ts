import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  buildRemoteStats,
  serializeTeknisiRemote,
  type UserParty,
} from '@/lib/teknisi-layanan-serializer'

export const dynamic = 'force-dynamic'

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof UserParty, true>

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const rows = await prisma.remoteSession.findMany({
      where: { teknisiId: session.user.id },
      include: { user: { select: USER_SELECT } },
      orderBy: { updatedAt: 'desc' },
    })

    const items = rows.map(serializeTeknisiRemote)
    return apiSuccess({ items, stats: buildRemoteStats(items) })
  } catch (e) {
    console.error('[TEKNISI_REMOTE_GET]', e)
    return apiError('Gagal memuat daftar remote', 500)
  }
}
