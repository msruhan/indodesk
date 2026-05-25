import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeAdminTopupProduct } from '@/lib/topup-catalog-serializer'
import { slugFromName } from '@/lib/admin-product-serializer'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  slug: z.string().min(2).max(80).optional(),
  category: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  publisher: z.string().min(2).max(120),
  logo: z.string().url(),
  cover: z.string().url(),
  accent: z.string().max(120).optional(),
  description: z.string().min(10).max(5000),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().min(0).optional(),
  ordersToday: z.number().int().min(0).optional(),
  isHot: z.boolean().optional(),
  isActive: z.boolean().optional(),
  idLabel: z.string().min(2).max(60).optional(),
  serverLabel: z.string().max(60).nullable().optional(),
  idHelp: z.string().min(5).max(500),
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const products = await prisma.topupCatalogProduct.findMany({
      include: { denominations: true },
      orderBy: { sortOrder: 'asc' },
    })
    return apiSuccess(products.map(serializeAdminTopupProduct))
  } catch (e) {
    console.error('[ADMIN_TOPUP_PRODUCTS_GET]', e)
    return apiError('Gagal memuat produk topup', 500)
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
    let slug = data.slug?.trim() || slugFromName(data.name)
    if (!slug) slug = `topup-${Date.now()}`

    const existing = await prisma.topupCatalogProduct.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const maxOrder = await prisma.topupCatalogProduct.aggregate({ _max: { sortOrder: true } })

    const product = await prisma.topupCatalogProduct.create({
      data: {
        slug,
        category: data.category,
        name: data.name.trim(),
        publisher: data.publisher.trim(),
        logo: data.logo.trim(),
        cover: data.cover.trim(),
        accent: data.accent?.trim() ?? '',
        description: data.description.trim(),
        rating: data.rating ?? 4.8,
        ratingCount: data.ratingCount ?? 0,
        ordersToday: data.ordersToday ?? 0,
        isHot: data.isHot ?? false,
        isActive: data.isActive ?? true,
        idLabel: data.idLabel?.trim() ?? 'User ID',
        serverLabel: data.serverLabel?.trim() || null,
        idHelp: data.idHelp.trim(),
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
      include: { denominations: true },
    })

    return apiSuccess(serializeAdminTopupProduct(product), 201)
  } catch (e) {
    console.error('[ADMIN_TOPUP_PRODUCTS_POST]', e)
    return apiError('Gagal menambah produk topup', 500)
  }
}
