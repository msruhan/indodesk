import { z } from 'zod'
import { ProductCategory } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeAdminProduct } from '@/lib/admin-product-serializer'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  price: z.number().positive().optional(),
  description: z.string().max(5000).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().url().nullable().optional().or(z.literal('')),
  sellerId: z.string().min(1).optional(),
  listingStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  isPublished: z.boolean().optional(),
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
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return apiError('Produk tidak ditemukan', 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data
    if (data.sellerId) {
      const seller = await prisma.user.findFirst({
        where: { id: data.sellerId, role: 'TEKNISI' },
      })
      if (!seller) return apiError('Teknisi tidak ditemukan')
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.image !== undefined && { image: data.image?.trim() || null }),
        ...(data.sellerId !== undefined && { sellerId: data.sellerId }),
        ...(data.listingStatus !== undefined && { listingStatus: data.listingStatus }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { seller: { select: { id: true, name: true } } },
    })

    return apiSuccess(serializeAdminProduct(product))
  } catch (e) {
    console.error('[ADMIN_PRODUCTS_PATCH]', e)
    return apiError('Gagal memperbarui produk', 500)
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
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return apiError('Produk tidak ditemukan', 404)

    await prisma.product.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[ADMIN_PRODUCTS_DELETE]', e)
    return apiError('Gagal menghapus produk', 500)
  }
}
