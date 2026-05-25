import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializeHelpArticle } from '@/lib/help-serializer'
import { getPublicPlatformContact } from '@/lib/platform-settings'

export const dynamic = 'force-dynamic'

const VALID_AUDIENCES = new Set(['user', 'teknisi', 'admin'])

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const audience = searchParams.get('audience') ?? 'user'

  if (!VALID_AUDIENCES.has(audience)) {
    return apiError('Audience tidak valid')
  }

  try {
    const [articles, contact] = await Promise.all([
      prisma.helpArticle.findMany({
        where: { audience, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      getPublicPlatformContact(),
    ])
    return apiSuccess({
      articles: articles.map(serializeHelpArticle),
      contact,
    })
  } catch (e) {
    console.error('[HELP_GET]', e)
    return apiError('Gagal memuat bantuan', 500)
  }
}
