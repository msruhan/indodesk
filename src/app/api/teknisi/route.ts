import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializePublicTeknisi } from '@/lib/teknisi-public'
import { syncTeknisiCompletedSessions } from '@/lib/teknisi-stats-server'

export const dynamic = 'force-dynamic'

/** GET /api/teknisi — daftar teknisi publik untuk halaman listing */
export async function GET() {
  try {
    const profiles = await prisma.teknisiProfile.findMany({
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: [{ isOnline: 'desc' }, { rating: 'desc' }, { totalKonsultasi: 'desc' }],
    })

    const data = await Promise.all(
      profiles.map(async (profile) => {
        const completedSessions = await syncTeknisiCompletedSessions(profile.userId)
        return serializePublicTeknisi({ ...profile, totalKonsultasi: completedSessions })
      }),
    )

    return apiSuccess(data)
  } catch (e) {
    console.error('[TEKNISI_LIST_GET]', e)
    return apiError('Gagal memuat daftar teknisi', 500)
  }
}
