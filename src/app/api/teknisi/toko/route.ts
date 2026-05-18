import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { saveStoreCover, deleteStoreCover } from '@/lib/store-image'
import { serializeTeknisiStore } from '@/lib/teknisi-store-serializer'

export const dynamic = 'force-dynamic'

const storeSchema = z.object({
  name: z.string().min(3, 'Nama toko minimal 3 karakter').max(120),
  city: z.string().max(80).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  jamWeekdays: z.string().max(50).optional(),
  jamWeekend: z.string().max(50).optional(),
  layanan: z.string().optional(),
})

function parseLayanan(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
}

async function getStoreWithProfile(userId: string) {
  const store = await prisma.teknisiStore.findUnique({
    where: { userId },
  })
  if (!store) return null

  const profile = await prisma.teknisiProfile.findUnique({
    where: { userId },
    select: { rating: true, reviewCount: true },
  })

  return serializeTeknisiStore(store, profile)
}

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const data = await getStoreWithProfile(session.user.id)
    return apiSuccess(data)
  } catch (e) {
    console.error('[TEKNISI_TOKO_GET]', e)
    return apiError('Gagal mengambil data toko', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const existing = await prisma.teknisiStore.findUnique({
      where: { userId: session.user.id },
    })
    if (existing) {
      return apiError('Anda sudah memiliki toko. Gunakan edit untuk memperbarui.')
    }

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const parsed = storeSchema.safeParse({
        name: String(form.get('name') ?? '').trim(),
        city: String(form.get('city') ?? '').trim() || undefined,
        address: String(form.get('address') ?? '').trim() || undefined,
        phone: String(form.get('phone') ?? '').trim() || undefined,
        email: String(form.get('email') ?? '').trim() || undefined,
        jamWeekdays: String(form.get('jamWeekdays') ?? '').trim() || undefined,
        jamWeekend: String(form.get('jamWeekend') ?? '').trim() || undefined,
        layanan: String(form.get('layanan') ?? ''),
      })
      if (!parsed.success) {
        return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
      }

      let coverImage: string | null = null
      const file = form.get('cover')
      if (file instanceof File && file.size > 0) {
        coverImage = await saveStoreCover(file, session.user.id)
      }

      const store = await prisma.teknisiStore.create({
        data: {
          userId: session.user.id,
          name: parsed.data.name,
          city: parsed.data.city ?? null,
          address: parsed.data.address ?? null,
          phone: parsed.data.phone ?? null,
          email: parsed.data.email || null,
          jamWeekdays: parsed.data.jamWeekdays ?? null,
          jamWeekend: parsed.data.jamWeekend ?? null,
          layanan: parseLayanan(parsed.data.layanan),
          coverImage,
          listingStatus: 'APPROVED',
          isPublished: false,
        },
      })

      const profile = await prisma.teknisiProfile.findUnique({
        where: { userId: session.user.id },
        select: { rating: true, reviewCount: true },
      })

      return apiSuccess(serializeTeknisiStore(store, profile), 201)
    }

    const body = await req.json()
    const parsed = storeSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const store = await prisma.teknisiStore.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        city: parsed.data.city ?? null,
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email || null,
        jamWeekdays: parsed.data.jamWeekdays ?? null,
        jamWeekend: parsed.data.jamWeekend ?? null,
        layanan: parseLayanan(parsed.data.layanan),
        listingStatus: 'APPROVED',
        isPublished: false,
      },
    })

    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: session.user.id },
      select: { rating: true, reviewCount: true },
    })

    return apiSuccess(serializeTeknisiStore(store, profile), 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal membuat toko'
    console.error('[TEKNISI_TOKO_POST]', e)
    return apiError(message, 500)
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const existing = await prisma.teknisiStore.findUnique({
      where: { userId: session.user.id },
    })
    if (!existing) return apiError('Toko tidak ditemukan', 404)

    const contentType = req.headers.get('content-type') ?? ''
    const data: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const name = form.get('name')
      const city = form.get('city')
      const address = form.get('address')
      const phone = form.get('phone')
      const email = form.get('email')
      const jamWeekdays = form.get('jamWeekdays')
      const jamWeekend = form.get('jamWeekend')
      const layanan = form.get('layanan')
      const togglePublish = form.get('togglePublish')
      const file = form.get('cover')

      if (typeof name === 'string' && name.trim()) data.name = name.trim()
      if (typeof city === 'string') data.city = city.trim() || null
      if (typeof address === 'string') data.address = address.trim() || null
      if (typeof phone === 'string') data.phone = phone.trim() || null
      if (typeof email === 'string') data.email = email.trim() || null
      if (typeof jamWeekdays === 'string') data.jamWeekdays = jamWeekdays.trim() || null
      if (typeof jamWeekend === 'string') data.jamWeekend = jamWeekend.trim() || null
      if (typeof layanan === 'string') data.layanan = parseLayanan(layanan)

      if (togglePublish === 'true') {
        data.isPublished = !existing.isPublished
      }

      if (file instanceof File && file.size > 0) {
        const coverImage = await saveStoreCover(file, session.user.id)
        await deleteStoreCover(existing.coverImage)
        data.coverImage = coverImage
      }
    } else {
      const body = await req.json()
      const parsed = storeSchema.partial().safeParse(body)
      if (!parsed.success) {
        return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
      }
      if (parsed.data.name) data.name = parsed.data.name
      if (parsed.data.city !== undefined) data.city = parsed.data.city || null
      if (parsed.data.address !== undefined) data.address = parsed.data.address || null
      if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null
      if (parsed.data.email !== undefined) data.email = parsed.data.email || null
      if (parsed.data.jamWeekdays !== undefined) data.jamWeekdays = parsed.data.jamWeekdays || null
      if (parsed.data.jamWeekend !== undefined) data.jamWeekend = parsed.data.jamWeekend || null
      if (parsed.data.layanan !== undefined) data.layanan = parseLayanan(parsed.data.layanan)
      if (body.togglePublish === true) data.isPublished = !existing.isPublished
    }

    const store = await prisma.teknisiStore.update({
      where: { userId: session.user.id },
      data,
    })

    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: session.user.id },
      select: { rating: true, reviewCount: true },
    })

    return apiSuccess(serializeTeknisiStore(store, profile))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal memperbarui toko'
    console.error('[TEKNISI_TOKO_PATCH]', e)
    return apiError(message, 500)
  }
}

export async function DELETE() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const existing = await prisma.teknisiStore.findUnique({
      where: { userId: session.user.id },
    })
    if (!existing) return apiError('Toko tidak ditemukan', 404)

    await deleteStoreCover(existing.coverImage)
    await prisma.teknisiStore.delete({ where: { userId: session.user.id } })

    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[TEKNISI_TOKO_DELETE]', e)
    return apiError('Gagal menghapus toko', 500)
  }
}
