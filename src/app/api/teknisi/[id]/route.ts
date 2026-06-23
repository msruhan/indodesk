import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { getPublicFeatureFlags } from '@/lib/platform-settings'
import { serializePublicTeknisiDetail } from '@/lib/teknisi-public-detail'
import { getTeknisiPlatformStats } from '@/lib/teknisi-platform-stats'
import { isTeknisiProfilePubliclyVisible } from '@/lib/teknisi-profile-visibility'
import { ensureTeknisiProfileSlugForUser, resolveTeknisiUserId } from '@/lib/teknisi-profile-slug-server'

export const dynamic = 'force-dynamic'

/** GET /api/teknisi/[id] — profil teknisi publik untuk halaman detail */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: slugOrId } = await params

  try {
    const flags = await getPublicFeatureFlags()
    if (!flags.cariTeknisiEnabled) {
      return apiError('Cari Teknisi sedang dinonaktifkan', 403)
    }

    const userId = await resolveTeknisiUserId(slugOrId)
    if (!userId) {
      return apiError('Teknisi tidak ditemukan', 404)
    }

    const profile = await prisma.teknisiProfile.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
            teknisiStore: true,
            teknisiPortfolioCases: {
              orderBy: { sortOrder: 'asc' },
            },
            teknisiCertifications: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!profile || !isTeknisiProfilePubliclyVisible(profile)) {
      return apiError('Teknisi tidak ditemukan', 404)
    }

    void prisma.teknisiProfile.update({
      where: { id: profile.id },
      data: { totalView: { increment: 1 } },
    }).catch(() => {})

    const platformStats = await getTeknisiPlatformStats(userId)
    const featureFlags = await getPublicFeatureFlags()
    const postCount = await prisma.teknisiPost.count({
      where: { teknisiId: userId, deletedAt: null },
    })

    const profileSlug = profile.profileSlug ?? (await ensureTeknisiProfileSlugForUser(userId))
    const payload = serializePublicTeknisiDetail(
      profileSlug ? { ...profile, profileSlug } : profile,
      platformStats,
      featureFlags,
      postCount,
    )
    return apiSuccess(payload)
  } catch (e) {
    console.error('[TEKNISI_DETAIL_GET]', e)
    return apiError('Gagal memuat profil teknisi', 500)
  }
}
