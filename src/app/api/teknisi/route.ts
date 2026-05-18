import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializePublicTeknisi } from '@/lib/teknisi-public'

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

    return apiSuccess(profiles.map(serializePublicTeknisi))
  } catch (e) {
    console.error('[TEKNISI_LIST_GET]', e)
    return apiError('Gagal memuat daftar teknisi', 500)
  }
}
