import { z } from 'zod'
import { ProductCategory } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { saveProductImage } from '@/lib/product-image'
import { serializeTeknisiProduct } from '@/lib/product-serializer'

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
      const file = form.get('image')

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

      let imageUrl: string | null = null
      if (file instanceof File && file.size > 0) {
        imageUrl = await saveProductImage(file, session.user.id)
      }

      const product = await prisma.product.create({
        data: {
          sellerId: session.user.id,
          name: parsed.data.name,
          category: parsed.data.category,
          price: parsed.data.price,
          description: parsed.data.description ?? null,
          image: imageUrl,
          stock: parsed.data.stock ?? 1,
          listingStatus: 'APPROVED',
          isPublished: false,
        },
      })

      return apiSuccess(serializeTeknisiProduct(product), 201)
    }

    const body = await req.json()
    const parsed = createJsonSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const product = await prisma.product.create({
      data: {
        sellerId: session.user.id,
        name: parsed.data.name,
        category: parsed.data.category,
        price: parsed.data.price,
        description: parsed.data.description ?? null,
        stock: parsed.data.stock ?? 1,
        listingStatus: 'APPROVED',
        isPublished: false,
      },
    })

    return apiSuccess(serializeTeknisiProduct(product), 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal menambah produk'
    console.error('[TEKNISI_PRODUCTS_POST]', e)
    return apiError(message, 500)
  }
}
