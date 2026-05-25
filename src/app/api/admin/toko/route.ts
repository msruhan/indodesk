import { z } from 'zod'
import { ProductListingStatus, UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeAdminToko } from '@/lib/admin-store-serializer'

export const dynamic = 'force-dynamic'

const listingStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] as const

const storeBodySchema = z.object({
  name: z.string().min(3).max(120),
  city: z.string().max(80).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  jamWeekdays: z.string().max(50).optional(),
  jamWeekend: z.string().max(50).optional(),
  layanan: z.string().optional(),
  badge: z.string().max(60).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  listingStatus: z.enum(listingStatuses).optional(),
  isPublished: z.boolean().optional(),
})

const createSchema = storeBodySchema.extend({
  userId: z.string().min(1),
})

function parseLayanan(raw?: string): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
}

const storeInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      teknisiProfile: { select: { rating: true, reviewCount: true } },
    },
  },
} as const

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const stores = await prisma.teknisiStore.findMany({
      include: storeInclude,
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(stores.map(serializeAdminToko))
  } catch (e) {
    console.error('[ADMIN_TOKO_GET]', e)
    return apiError('Gagal memuat toko', 500)
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

    const owner = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { teknisiStore: true },
    })
    if (!owner || owner.role !== UserRole.TEKNISI) {
      return apiError('Teknisi tidak ditemukan', 404)
    }
    if (owner.teknisiStore) {
      return apiError('Teknisi ini sudah memiliki toko', 409)
    }

    const store = await prisma.teknisiStore.create({
      data: {
        userId: data.userId,
        name: data.name.trim(),
        city: data.city?.trim() || null,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        jamWeekdays: data.jamWeekdays?.trim() || null,
        jamWeekend: data.jamWeekend?.trim() || null,
        layanan: parseLayanan(data.layanan),
        badge: data.badge?.trim() || null,
        coverImage: data.coverImage?.trim() || null,
        listingStatus: (data.listingStatus as ProductListingStatus) ?? 'APPROVED',
        isPublished: data.isPublished ?? true,
      },
      include: storeInclude,
    })

    return apiSuccess(serializeAdminToko(store), 201)
  } catch (e) {
    console.error('[ADMIN_TOKO_POST]', e)
    return apiError('Gagal menambah toko', 500)
  }
}
