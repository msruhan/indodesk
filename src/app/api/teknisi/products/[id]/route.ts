import { z } from 'zod'
import { ProductCategory, type Product } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  deleteAllProductImages,
  deleteRemovedProductImages,
  imagesChanged,
  resolveProductImagesFromForm,
} from '@/lib/product-image-api'
import {
  queueProductContentReview,
  type ProductContentPatch,
} from '@/lib/product-listing-review'
import { couponInputToDb, parseCouponFromForm } from '@/lib/product-coupon'
import { serializeTeknisiProduct } from '@/lib/product-serializer'
import { notifyProductPublishedIfTransition, notifyAdminProductPendingIfTransition } from '@/lib/telegram/notify'
import {
  parseBenchmarkFieldsFromForm,
  parseProductSpecsFromForm,
  specsToDb,
  validateProductSpecs,
} from '@/lib/product-specs'
import {
  parseProductWeightKg,
  validateProductWeightKg,
} from '@/lib/product-weight'
import {
  parseSaleConditionFromForm,
  shouldSkipUsedProductBenchmarkInput,
} from '@/lib/product-sale-condition'

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

function assertCanTogglePublish(existing: Product) {
  if (existing.listingStatus === 'REJECTED') {
    return apiError('Produk ditolak. Edit dan kirim ulang untuk review admin.')
  }
  if (existing.listingStatus === 'PENDING') {
    return apiError('Produk masih menunggu review admin.')
  }
  if (existing.listingStatus !== 'APPROVED') {
    return apiError('Produk harus disetujui admin sebelum dipublikasikan.')
  }
  return null
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
      const togglePublish = form.get('togglePublish')
      const hasImagePayload =
        form.has('imageOrder') || form.has('existingImages') || form.getAll('images').length > 0
      const has3uToolsPayload =
        form.has('3utools_imageOrder') || form.getAll('3utools_images').length > 0

      const data: Record<string, unknown> = {}
      const patch: ProductContentPatch = {}

      if (typeof name === 'string' && name.trim()) {
        patch.name = name.trim()
        data.name = patch.name
      }
      if (typeof category === 'string' && category) {
        patch.category = category as ProductCategory
        data.category = patch.category
      }
      if (typeof price === 'string' && price) {
        patch.price = Number(price)
        data.price = patch.price
      }
      if (description !== null) {
        patch.description =
          typeof description === 'string' && description.trim() ? description.trim() : null
        data.description = patch.description
      }
      if (typeof stock === 'string' && stock) {
        patch.stock = Number(stock)
        data.stock = patch.stock
      }

      const weightField = form.get('weightKg')
      if (weightField !== null) {
        const resolvedCategory =
          typeof form.get('category') === 'string' && form.get('category')
            ? (form.get('category') as ProductCategory)
            : existing.category
        const weightKg = parseProductWeightKg(weightField)
        const weightError = validateProductWeightKg(weightKg, resolvedCategory)
        if (weightError) return apiError(weightError)
        patch.weightKg = weightKg ?? 1
        data.weightKg = patch.weightKg
      }

      if (
        form.has('color') ||
        form.has('ram') ||
        form.has('processor') ||
        form.has('storage') ||
        form.has('warranty') ||
        form.has('completeness')
      ) {
        const categoryField = form.get('category')
        const resolvedCategory =
          typeof categoryField === 'string' && categoryField
            ? (categoryField as ProductCategory)
            : existing.category
        const specs = parseProductSpecsFromForm(form, resolvedCategory)
        const specsError = validateProductSpecs(specs)
        if (specsError) return apiError(specsError)
        patch.color = specs.color
        patch.ram = specs.ram
        patch.processor = specs.processor
        patch.storage = specs.storage
        patch.warranty = specs.warranty
        patch.completeness = specs.completeness
        Object.assign(data, specsToDb(specs))
      }

      if (hasImagePayload) {
        const resolved = await resolveProductImagesFromForm(form, session.user.id, existing)
        await deleteRemovedProductImages(existing, resolved)
        patch.images = resolved.images
        patch.image = resolved.image
        data.images = resolved.images as object
        data.image = resolved.image
      }

      const resolvedCategory =
        typeof form.get('category') === 'string' && form.get('category')
          ? (form.get('category') as ProductCategory)
          : existing.category
      const saleCondition = parseSaleConditionFromForm(form)
      const skipBenchmarkInput = shouldSkipUsedProductBenchmarkInput(
        saleCondition,
        resolvedCategory,
      )

      if (skipBenchmarkInput) {
        data.threeUtoolsImages = []
        data.verified3uTools = false
      } else if (has3uToolsPayload) {
        const resolved3u = await resolveProductImagesFromForm(
          form,
          session.user.id,
          undefined,
          '3utools_',
        )
        data.threeUtoolsImages = resolved3u.images as object
        if (resolved3u.images.length > 0) {
          data.verified3uTools = true
        }
      }

      const benchmarkData = parseBenchmarkFieldsFromForm(form, resolvedCategory)
      Object.assign(data, benchmarkData)

      if (form.has('couponEnabled')) {
        const productPrice =
          typeof price === 'string' && price ? Number(price) : Number(existing.price)
        try {
          const couponDb = couponInputToDb(parseCouponFromForm(form), productPrice)
          Object.assign(data, couponDb)
          patch.couponCode = couponDb.couponCode
          patch.couponDiscountType = couponDb.couponDiscountType
          patch.couponDiscountValue =
            couponDb.couponDiscountValue != null ? Number(couponDb.couponDiscountValue) : null
        } catch (e) {
          return apiError(e instanceof Error ? e.message : 'Kupon tidak valid')
        }
      }

      if (togglePublish === 'true') {
        const publishError = assertCanTogglePublish(existing)
        if (publishError) return publishError
        data.isPublished = !existing.isPublished
      }

      queueProductContentReview(existing, data, patch)

      const product = await prisma.product.update({
        where: { id },
        data,
      })
      if (product.listingStatus === 'PENDING' && existing.listingStatus !== 'PENDING') {
        void notifyAdminProductPendingIfTransition(product.id, existing.listingStatus).catch((e) => {
          console.error('[ADMIN_PRODUCT_PENDING_NOTIFY]', e)
        })
      }
      if (togglePublish === 'true' && product.isPublished && !existing.isPublished) {
        void notifyProductPublishedIfTransition(product.id, false)
      }
      return apiSuccess(serializeTeknisiProduct(product))
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const { togglePublish, ...fields } = parsed.data
    const data: Record<string, unknown> = { ...fields }
    const patch: ProductContentPatch = { ...fields }

    if (togglePublish) {
      const publishError = assertCanTogglePublish(existing)
      if (publishError) return publishError
      data.isPublished = !existing.isPublished
    }

    queueProductContentReview(existing, data, patch)

    const product = await prisma.product.update({
      where: { id },
      data,
    })
    if (product.listingStatus === 'PENDING' && existing.listingStatus !== 'PENDING') {
      void notifyAdminProductPendingIfTransition(product.id, existing.listingStatus).catch((e) => {
        console.error('[ADMIN_PRODUCT_PENDING_NOTIFY]', e)
      })
    }
    if (togglePublish && product.isPublished && !existing.isPublished) {
      void notifyProductPublishedIfTransition(product.id, false)
    }
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

    await deleteAllProductImages(existing)
    await prisma.product.delete({ where: { id } })

    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[TEKNISI_PRODUCT_DELETE]', e)
    return apiError('Gagal menghapus produk', 500)
  }
}
