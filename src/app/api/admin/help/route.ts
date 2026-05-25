import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeHelpArticle } from '@/lib/help-serializer'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  audience: z.enum(['user', 'teknisi', 'admin']),
  question: z.string().min(5).max(500),
  answer: z.string().min(5).max(5000),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const rows = await prisma.helpArticle.findMany({
      orderBy: [{ audience: 'asc' }, { sortOrder: 'asc' }],
    })
    return apiSuccess(rows.map(serializeHelpArticle))
  } catch (e) {
    console.error('[ADMIN_HELP_GET]', e)
    return apiError('Gagal memuat FAQ', 500)
  }
}

export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const row = await prisma.helpArticle.create({
      data: {
        audience: parsed.data.audience,
        question: parsed.data.question.trim(),
        answer: parsed.data.answer.trim(),
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    })
    return apiSuccess(serializeHelpArticle(row), 201)
  } catch (e) {
    console.error('[ADMIN_HELP_POST]', e)
    return apiError('Gagal membuat FAQ', 500)
  }
}
