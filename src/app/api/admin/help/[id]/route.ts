import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeHelpArticle } from '@/lib/help-serializer'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  audience: z.enum(['user', 'teknisi', 'admin']).optional(),
  question: z.string().min(5).max(500).optional(),
  answer: z.string().min(5).max(5000).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const row = await prisma.helpArticle.update({
      where: { id },
      data: {
        ...parsed.data,
        question: parsed.data.question?.trim(),
        answer: parsed.data.answer?.trim(),
      },
    })
    return apiSuccess(serializeHelpArticle(row))
  } catch {
    return apiError('FAQ tidak ditemukan', 404)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    await prisma.helpArticle.delete({ where: { id } })
    return apiSuccess({ ok: true })
  } catch {
    return apiError('FAQ tidak ditemukan', 404)
  }
}
