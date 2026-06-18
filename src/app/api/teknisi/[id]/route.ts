import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { getPublicFeatureFlags } from '@/lib/platform-settings'
import { serializePublicTeknisiDetail } from '@/lib/teknisi-public-detail'
import { getTeknisiPlatformStats } from '@/lib/teknisi-platform-stats'

export const dynamic = 'force-dynamic'

/** GET /api/teknisi/[id] — profil teknisi publik untuk halaman detail */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const profile = await prisma.teknisiProfile.findFirst({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            teknisiStore: true,
            teknisiPortfolioCases: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!profile) {
      return apiError('Teknisi tidak ditemukan', 404)
    }

    void prisma.teknisiProfile.update({
      where: { id: profile.id },
      data: { totalView: { increment: 1 } },
    }).catch(() => {})

    const platformStats = await getTeknisiPlatformStats(id)
    const featureFlags = await getPublicFeatureFlags()
    return apiSuccess(serializePublicTeknisiDetail(profile, platformStats, featureFlags))
  } catch (e) {
    console.error('[TEKNISI_DETAIL_GET]', e)
    return apiError('Gagal memuat profil teknisi', 500)
  }
}
