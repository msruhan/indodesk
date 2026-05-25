import { z } from 'zod'
import { ProductCategory } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeAdminProduct } from '@/lib/admin-product-serializer'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(3).max(200),
  category: z.nativeEnum(ProductCategory),
  price: z.number().positive(),
  description: z.string().max(5000).optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().url().optional().or(z.literal('')),
  sellerId: z.string().min(1),
  listingStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const products = await prisma.product.findMany({
      include: { seller: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(products.map(serializeAdminProduct))
  } catch (e) {
    console.error('[ADMIN_PRODUCTS_GET]', e)
    return apiError('Gagal memuat produk', 500)
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

    const data = parsed.data
    const seller = await prisma.user.findFirst({
      where: { id: data.sellerId, role: 'TEKNISI' },
    })
    if (!seller) return apiError('Teknisi tidak ditemukan')

    const listingStatus = data.listingStatus ?? 'APPROVED'
    const product = await prisma.product.create({
      data: {
        sellerId: data.sellerId,
        name: data.name.trim(),
        category: data.category,
        price: data.price,
        description: data.description?.trim() || null,
        image: data.image?.trim() || null,
        stock: data.stock ?? 1,
        listingStatus,
        isPublished: data.isPublished ?? listingStatus === 'APPROVED',
        isActive: data.isActive ?? true,
      },
      include: { seller: { select: { id: true, name: true } } },
    })

    return apiSuccess(serializeAdminProduct(product), 201)
  } catch (e) {
    console.error('[ADMIN_PRODUCTS_POST]', e)
    return apiError('Gagal menambah produk', 500)
  }
}
