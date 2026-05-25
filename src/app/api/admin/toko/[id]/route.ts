import { z } from 'zod'
import { ProductListingStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeAdminToko } from '@/lib/admin-store-serializer'

export const dynamic = 'force-dynamic'

const listingStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] as const

const updateSchema = z.object({
  name: z.string().min(3).max(120).optional(),
  city: z.string().max(80).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  jamWeekdays: z.string().max(50).nullable().optional(),
  jamWeekend: z.string().max(50).nullable().optional(),
  layanan: z.string().optional(),
  badge: z.string().max(60).nullable().optional(),
  coverImage: z.string().url().optional().or(z.literal('')).nullable(),
  listingStatus: z.enum(listingStatuses).optional(),
  isPublished: z.boolean().optional(),
})

function parseLayanan(raw?: string): string[] | undefined {
  if (raw === undefined) return undefined
  if (!raw.trim()) return []
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await prisma.teknisiStore.findUnique({ where: { id } })
    if (!existing) return apiError('Toko tidak ditemukan', 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data
    const layanan = parseLayanan(data.layanan)

    const store = await prisma.teknisiStore.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.city !== undefined && { city: data.city?.trim() || null }),
        ...(data.address !== undefined && { address: data.address?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
        ...(data.jamWeekdays !== undefined && { jamWeekdays: data.jamWeekdays?.trim() || null }),
        ...(data.jamWeekend !== undefined && { jamWeekend: data.jamWeekend?.trim() || null }),
        ...(layanan !== undefined && { layanan }),
        ...(data.badge !== undefined && { badge: data.badge?.trim() || null }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage?.trim() || null }),
        ...(data.listingStatus !== undefined && {
          listingStatus: data.listingStatus as ProductListingStatus,
        }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
      include: storeInclude,
    })

    return apiSuccess(serializeAdminToko(store))
  } catch (e) {
    console.error('[ADMIN_TOKO_PATCH]', e)
    return apiError('Gagal memperbarui toko', 500)
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
    const existing = await prisma.teknisiStore.findUnique({ where: { id } })
    if (!existing) return apiError('Toko tidak ditemukan', 404)

    await prisma.teknisiStore.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[ADMIN_TOKO_DELETE]', e)
    return apiError('Gagal menghapus toko', 500)
  }
}
