import { z } from 'zod'
import { ProductCategory } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { saveProductImage, deleteProductImage } from '@/lib/product-image'
import { serializeTeknisiProduct } from '@/lib/product-serializer'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  price: z.number().positive().optional(),
  description: z.string().max(5000).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  togglePublish: z.boolean().optional(),
})

async function getOwnedProduct(id: string, sellerId: string) {
  return prisma.product.findFirst({
    where: { id, sellerId },
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params
  try {
    const product = await getOwnedProduct(id, session.user.id)
    if (!product) return apiError('Produk tidak ditemukan', 404)
    return apiSuccess(serializeTeknisiProduct(product))
  } catch (e) {
    console.error('[TEKNISI_PRODUCT_GET]', e)
    return apiError('Gagal mengambil produk', 500)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await getOwnedProduct(id, session.user.id)
    if (!existing) return apiError('Produk tidak ditemukan', 404)

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const name = form.get('name')
      const category = form.get('category')
      const price = form.get('price')
      const description = form.get('description')
      const stock = form.get('stock')
      const file = form.get('image')
      const togglePublish = form.get('togglePublish')

      const data: Record<string, unknown> = {}

      if (typeof name === 'string' && name.trim()) data.name = name.trim()
      if (typeof category === 'string' && category) data.category = category as ProductCategory
      if (typeof price === 'string' && price) data.price = Number(price)
      if (description !== null) {
        data.description =
          typeof description === 'string' && description.trim() ? description.trim() : null
      }
      if (typeof stock === 'string' && stock) data.stock = Number(stock)

      if (togglePublish === 'true') {
        if (existing.listingStatus === 'REJECTED') {
          return apiError('Produk ditolak. Edit dan simpan ulang sebelum publikasi.')
        }
        if (existing.listingStatus === 'PENDING') {
          return apiError('Produk masih menunggu review admin.')
        }
        data.isPublished = !existing.isPublished
        if (existing.listingStatus === 'DRAFT') {
          data.listingStatus = 'APPROVED'
          data.isPublished = true
        }
      }

      if (file instanceof File && file.size > 0) {
        const imageUrl = await saveProductImage(file, session.user.id)
        await deleteProductImage(existing.image)
        data.image = imageUrl
      }

      const product = await prisma.product.update({
        where: { id },
        data,
      })
      return apiSuccess(serializeTeknisiProduct(product))
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const { togglePublish, ...fields } = parsed.data
    const data: Record<string, unknown> = { ...fields }

    if (togglePublish) {
      if (existing.listingStatus === 'REJECTED') {
        return apiError('Produk ditolak. Edit dan simpan ulang sebelum publikasi.')
      }
      if (existing.listingStatus === 'PENDING') {
        return apiError('Produk masih menunggu review admin.')
      }
      data.isPublished = !existing.isPublished
      if (existing.listingStatus === 'DRAFT') {
        data.listingStatus = 'APPROVED'
        data.isPublished = true
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    })
    return apiSuccess(serializeTeknisiProduct(product))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal memperbarui produk'
    console.error('[TEKNISI_PRODUCT_PATCH]', e)
    return apiError(message, 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await getOwnedProduct(id, session.user.id)
    if (!existing) return apiError('Produk tidak ditemukan', 404)

    await deleteProductImage(existing.image)
    await prisma.product.delete({ where: { id } })

    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[TEKNISI_PRODUCT_DELETE]', e)
    return apiError('Gagal menghapus produk', 500)
  }
}
