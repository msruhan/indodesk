import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeAdminTopupProduct } from '@/lib/topup-catalog-serializer'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  category: z.string().min(2).max(40).optional(),
  name: z.string().min(2).max(120).optional(),
  publisher: z.string().min(2).max(120).optional(),
  logo: z.string().url().optional(),
  cover: z.string().url().optional(),
  accent: z.string().max(120).optional(),
  description: z.string().min(10).max(5000).optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().min(0).optional(),
  ordersToday: z.number().int().min(0).optional(),
  isHot: z.boolean().optional(),
  isActive: z.boolean().optional(),
  idLabel: z.string().min(2).max(60).optional(),
  serverLabel: z.string().max(60).nullable().optional(),
  idHelp: z.string().min(5).max(500).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { slug } = await params
  try {
    const existing = await prisma.topupCatalogProduct.findUnique({ where: { slug } })
    if (!existing) return apiError('Produk topup tidak ditemukan', 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data
    const product = await prisma.topupCatalogProduct.update({
      where: { slug },
      data: {
        ...(data.category !== undefined && { category: data.category }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.publisher !== undefined && { publisher: data.publisher.trim() }),
        ...(data.logo !== undefined && { logo: data.logo.trim() }),
        ...(data.cover !== undefined && { cover: data.cover.trim() }),
        ...(data.accent !== undefined && { accent: data.accent.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.ratingCount !== undefined && { ratingCount: data.ratingCount }),
        ...(data.ordersToday !== undefined && { ordersToday: data.ordersToday }),
        ...(data.isHot !== undefined && { isHot: data.isHot }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.idLabel !== undefined && { idLabel: data.idLabel.trim() }),
        ...(data.serverLabel !== undefined && { serverLabel: data.serverLabel?.trim() || null }),
        ...(data.idHelp !== undefined && { idHelp: data.idHelp.trim() }),
      },
      include: { denominations: true },
    })

    return apiSuccess(serializeAdminTopupProduct(product))
  } catch (e) {
    console.error('[ADMIN_TOPUP_PRODUCTS_PATCH]', e)
    return apiError('Gagal memperbarui produk topup', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { slug } = await params
  try {
    const existing = await prisma.topupCatalogProduct.findUnique({ where: { slug } })
    if (!existing) return apiError('Produk topup tidak ditemukan', 404)

    await prisma.topupCatalogProduct.delete({ where: { slug } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[ADMIN_TOPUP_PRODUCTS_DELETE]', e)
    return apiError('Gagal menghapus produk topup', 500)
  }
}
