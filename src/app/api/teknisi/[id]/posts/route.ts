import { prisma } from '@/lib/db'
import { apiError, apiSuccess, getApiSession } from '@/lib/api-auth'
import { getPublicFeatureFlags } from '@/lib/platform-settings'
import { serializeTeknisiPost } from '@/lib/teknisi-post'
import { teknisiPostInclude } from '@/lib/teknisi-post-queries'
import { isTeknisiProfilePubliclyVisible } from '@/lib/teknisi-profile-visibility'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 30

/** GET /api/teknisi/[id]/posts — feed posting publik teknisi */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teknisiId } = await params

  try {
    const flags = await getPublicFeatureFlags()
    if (!flags.cariTeknisiEnabled) {
      return apiError('Cari Teknisi sedang dinonaktifkan', 403)
    }

    const profile = await prisma.teknisiProfile.findFirst({
      where: { userId: teknisiId },
      select: { isProfileHidden: true },
    })

    if (!profile || !isTeknisiProfilePubliclyVisible(profile)) {
      return apiError('Teknisi tidak ditemukan', 404)
    }

    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT),
    )
    const skip = (page - 1) * limit

    const session = await getApiSession()
    const viewerId = session?.user?.id ?? null

    const [rows, total] = await Promise.all([
      prisma.teknisiPost.findMany({
        where: { teknisiId, deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: teknisiPostInclude(viewerId),
      }),
      prisma.teknisiPost.count({ where: { teknisiId, deletedAt: null } }),
    ])

    return apiSuccess({
      items: rows.map((row) => serializeTeknisiPost(row, viewerId)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: skip + rows.length < total,
      },
    })
  } catch (e) {
    console.error('[TEKNISI_PUBLIC_POSTS_GET]', e)
    return apiError('Gagal memuat posting', 500)
  }
}
