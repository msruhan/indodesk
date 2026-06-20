import { z } from 'zod'
import { ProductCategory, ProductWarranty } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { resolveProductImagesFromForm } from '@/lib/product-image-api'
import { serializeTeknisiProduct } from '@/lib/product-serializer'
import { NEW_PRODUCT_CHANGE_SUMMARY } from '@/lib/product-listing-review'
import { couponInputToDb, parseCouponFromForm } from '@/lib/product-coupon'
import {
  categoryRequiresSpecs,
  parseBenchmarkFieldsFromForm,
  parseCompletenessJson,
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

const createJsonSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter').max(200),
  category: z.nativeEnum(ProductCategory),
  price: z.number().positive('Harga harus lebih dari 0'),
  description: z.string().max(5000).optional(),
  stock: z.number().int().min(0).optional(),
})

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const products = await prisma.product.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(products.map(serializeTeknisiProduct))
  } catch (e) {
    console.error('[TEKNISI_PRODUCTS_GET]', e)
    return apiError('Gagal mengambil daftar produk', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const name = String(form.get('name') ?? '').trim()
      const category = String(form.get('category') ?? '') as ProductCategory
      const priceRaw = String(form.get('price') ?? '')
      const description = String(form.get('description') ?? '').trim() || null
      const stockRaw = String(form.get('stock') ?? '1')
      const weightRaw = form.get('weightKg')

      const parsed = createJsonSchema.safeParse({
        name,
        category,
        price: Number(priceRaw),
        description: description ?? undefined,
        stock: Number(stockRaw),
      })
      if (!parsed.success) {
        return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
      }

      const weightKg = parseProductWeightKg(weightRaw)
      const weightError = validateProductWeightKg(weightKg, parsed.data.category)
      if (weightError) return apiError(weightError)

      const specs = parseProductSpecsFromForm(form, parsed.data.category)
      const specsError = validateProductSpecs(specs)
      if (specsError) return apiError(specsError)

      const { images, image } = await resolveProductImagesFromForm(form, session.user.id)
      const saleCondition = parseSaleConditionFromForm(form)
      const skipBenchmarkInput = shouldSkipUsedProductBenchmarkInput(
        saleCondition,
        parsed.data.category,
      )
      let threeUtoolsImages: Awaited<
        ReturnType<typeof resolveProductImagesFromForm>
      >['images'] = []
      if (!skipBenchmarkInput) {
        const resolved3u = await resolveProductImagesFromForm(
          form,
          session.user.id,
          undefined,
          '3utools_',
        )
        threeUtoolsImages = resolved3u.images
      }
      const benchmarkData = parseBenchmarkFieldsFromForm(form, parsed.data.category)
      if (threeUtoolsImages.length > 0) {
        benchmarkData.verified3uTools = true
      }

      let couponData
      try {
        couponData = couponInputToDb(parseCouponFromForm(form), parsed.data.price)
      } catch (e) {
        return apiError(e instanceof Error ? e.message : 'Kupon tidak valid')
      }

      const product = await prisma.product.create({
        data: {
          sellerId: session.user.id,
          name: parsed.data.name,
          category: parsed.data.category,
          price: parsed.data.price,
          description: parsed.data.description ?? null,
          image,
          images: images as object,
          threeUtoolsImages: threeUtoolsImages as object,
          stock: parsed.data.stock ?? 1,
          weightKg: weightKg ?? 1,
          ...specsToDb(specs),
          ...benchmarkData,
          ...couponData,
          listingStatus: 'PENDING',
          isPublished: false,
          pendingChangeSummary: NEW_PRODUCT_CHANGE_SUMMARY,
        },
      })

      return apiSuccess(serializeTeknisiProduct(product), 201)
    }

    const body = await req.json()
    const parsed = createJsonSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const weightKg = parseProductWeightKg(body.weightKg)
    const weightError = validateProductWeightKg(weightKg, parsed.data.category)
    if (weightError) return apiError(weightError)

    if (categoryRequiresSpecs(parsed.data.category)) {
      const specs = {
        category: parsed.data.category,
        color: String(body.color ?? '').trim(),
        ram: String(body.ram ?? '').trim(),
        processor: String(body.processor ?? '').trim(),
        storage: String(body.storage ?? '').trim(),
        warranty: body.warranty as ProductWarranty,
        completeness: parseCompletenessJson(body.completeness, parsed.data.category),
      }
      const specsError = validateProductSpecs(specs)
      if (specsError) return apiError(specsError)

      const product = await prisma.product.create({
        data: {
          sellerId: session.user.id,
          name: parsed.data.name,
          category: parsed.data.category,
          price: parsed.data.price,
          description: parsed.data.description ?? null,
          images: [],
          stock: parsed.data.stock ?? 1,
          weightKg: weightKg ?? 1,
          ...specsToDb(specs),
          listingStatus: 'PENDING',
          isPublished: false,
          pendingChangeSummary: NEW_PRODUCT_CHANGE_SUMMARY,
        },
      })
      return apiSuccess(serializeTeknisiProduct(product), 201)
    }

    const product = await prisma.product.create({
      data: {
        sellerId: session.user.id,
        name: parsed.data.name,
        category: parsed.data.category,
        price: parsed.data.price,
        description: parsed.data.description ?? null,
        images: [],
        stock: parsed.data.stock ?? 1,
        weightKg: weightKg ?? 1,
        listingStatus: 'PENDING',
        isPublished: false,
        pendingChangeSummary: NEW_PRODUCT_CHANGE_SUMMARY,
      },
    })

    return apiSuccess(serializeTeknisiProduct(product), 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal menambah produk'
    console.error('[TEKNISI_PRODUCTS_POST]', e)
    return apiError(message, 500)
  }
}
