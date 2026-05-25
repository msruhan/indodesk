import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { portfolioImageUrlSchema } from '@/lib/portfolio-image'
import { deletePortfolioImage } from '@/lib/portfolio-image-server'
import { serializeTeknisiPortfolioCase } from '@/lib/teknisi-portfolio'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  meta: z.string().max(120).optional(),
  result: z.string().max(280).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable().optional(),
  icon: z.enum(['smartphone', 'wrench', 'laptop']).optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.teknisiPortfolioCase.findFirst({
      where: { id, teknisiId: session.user.id },
    })
    if (!existing) return apiError('Item portfolio tidak ditemukan', 404)

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const row = await prisma.teknisiPortfolioCase.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() } : {}),
        ...(parsed.data.meta !== undefined ? { meta: parsed.data.meta.trim() } : {}),
        ...(parsed.data.result !== undefined ? { result: parsed.data.result.trim() } : {}),
        ...(parsed.data.imageUrl !== undefined
          ? { imageUrl: parsed.data.imageUrl?.trim() || null }
          : {}),
        ...(parsed.data.icon !== undefined ? { icon: parsed.data.icon } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      },
    })

    return apiSuccess(serializeTeknisiPortfolioCase(row))
  } catch (e) {
    console.error('[TEKNISI_PORTFOLIO_PATCH]', e)
    return apiError('Gagal memperbarui portfolio', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.teknisiPortfolioCase.findFirst({
      where: { id, teknisiId: session.user.id },
    })
    if (!existing) return apiError('Item portfolio tidak ditemukan', 404)

    await deletePortfolioImage(existing.imageUrl)
    await prisma.teknisiPortfolioCase.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[TEKNISI_PORTFOLIO_DELETE]', e)
    return apiError('Gagal menghapus portfolio', 500)
  }
}
