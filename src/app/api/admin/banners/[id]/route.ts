import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { bannerCreateData, serializeBanner } from '@/lib/banner-serializer'
import { placementPath, type BannerPlacement } from '@/lib/marketplace-banners'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  subtitle: z.string().max(500).optional(),
  image: z.string().min(10).optional(),
  buttonText: z.string().max(80).optional(),
  active: z.boolean().optional(),
  placement: z.enum(['marketplace', 'shop', 'topup']).optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.marketplaceBanner.findUnique({ where: { id } })
    if (!existing) return apiError('Banner tidak ditemukan', 404)

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const placement = (parsed.data.placement ?? existing.placement) as BannerPlacement
    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.placement) {
      data.link = placementPath(placement)
    }
    if (parsed.data.title !== undefined) data.title = parsed.data.title.trim()
    if (parsed.data.subtitle !== undefined) data.subtitle = parsed.data.subtitle.trim()
    if (parsed.data.image !== undefined) data.image = parsed.data.image.trim()
    if (parsed.data.buttonText !== undefined) data.buttonText = parsed.data.buttonText.trim()

    const row = await prisma.marketplaceBanner.update({
      where: { id },
      data,
    })
    return apiSuccess(serializeBanner(row))
  } catch (e) {
    console.error('[ADMIN_BANNERS_PATCH]', e)
    return apiError('Gagal memperbarui banner', 500)
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
    await prisma.marketplaceBanner.delete({ where: { id } })
    return apiSuccess({ ok: true })
  } catch {
    return apiError('Banner tidak ditemukan', 404)
  }
}
