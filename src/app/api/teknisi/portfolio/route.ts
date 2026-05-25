import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { portfolioImageUrlSchema } from '@/lib/portfolio-image'
import { serializeTeknisiPortfolioCase } from '@/lib/teknisi-portfolio'

export const dynamic = 'force-dynamic'

const portfolioSchema = z.object({
  title: z.string().min(2).max(120),
  meta: z.string().max(120),
  result: z.string().max(280),
  imageUrl: portfolioImageUrlSchema,
  icon: z.enum(['smartphone', 'wrench', 'laptop']).optional(),
})

const PORTFOLIO_THEMES = [
  { tone: 'from-primary-500 to-emerald-600', glow: 'rgba(16,185,129,0.4)' },
  { tone: 'from-cyan-500 to-blue-600', glow: 'rgba(6,182,212,0.4)' },
  { tone: 'from-violet-500 to-fuchsia-600', glow: 'rgba(139,92,246,0.4)' },
  { tone: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.35)' },
]

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const rows = await prisma.teknisiPortfolioCase.findMany({
      where: { teknisiId: session.user.id },
      orderBy: { sortOrder: 'asc' },
    })
    return apiSuccess(rows.map(serializeTeknisiPortfolioCase))
  } catch (e) {
    console.error('[TEKNISI_PORTFOLIO_GET]', e)
    return apiError('Gagal memuat portfolio', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = portfolioSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const count = await prisma.teknisiPortfolioCase.count({
      where: { teknisiId: session.user.id },
    })
    if (count >= 12) return apiError('Maksimal 12 item portfolio')

    const theme = PORTFOLIO_THEMES[count % PORTFOLIO_THEMES.length]!
    const row = await prisma.teknisiPortfolioCase.create({
      data: {
        teknisiId: session.user.id,
        title: parsed.data.title.trim(),
        meta: parsed.data.meta.trim(),
        result: parsed.data.result.trim(),
        imageUrl: parsed.data.imageUrl?.trim() || null,
        icon: parsed.data.icon ?? 'smartphone',
        tone: theme.tone,
        glow: theme.glow,
        sortOrder: count,
      },
    })

    return apiSuccess(serializeTeknisiPortfolioCase(row), 201)
  } catch (e) {
    console.error('[TEKNISI_PORTFOLIO_POST]', e)
    return apiError('Gagal menambah portfolio', 500)
  }
}
