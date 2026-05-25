import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { saveStoreCover, deleteStoreCover } from '@/lib/store-image'
import { serializeTeknisiStore } from '@/lib/teknisi-store-serializer'
import {
  parseStoreFormPayload,
  readStoreFieldsFromFormData,
  storeFieldsSchema,
} from '@/lib/teknisi-store-api'

export const dynamic = 'force-dynamic'

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

function hasContentFieldUpdate(data: Record<string, unknown>) {
  return [
    'name',
    'city',
    'address',
    'phone',
    'email',
    'instagram',
    'tiktok',
    'operatingHours',
    'jamWeekdays',
    'jamWeekend',
    'layanan',
    'journey',
    'journeyIntro',
    'coverImage',
  ].some((k) => data[k] !== undefined)
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
    let parsedPayload: ReturnType<typeof parseStoreFormPayload>
    let coverImage: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const parsed = storeFieldsSchema.safeParse(readStoreFieldsFromFormData(form))
      if (!parsed.success) {
        return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
      }
      parsedPayload = parseStoreFormPayload(parsed.data)
      const file = form.get('cover')
      if (file instanceof File && file.size > 0) {
        coverImage = await saveStoreCover(file, session.user.id)
      }
    } else {
      const body = await req.json()
      const parsed = storeFieldsSchema.safeParse(body)
      if (!parsed.success) {
        return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
      }
      parsedPayload = parseStoreFormPayload(parsed.data)
    }

    const store = await prisma.teknisiStore.create({
      data: {
        userId: session.user.id,
        ...parsedPayload,
        coverImage,
        listingStatus: 'PENDING',
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
      const togglePublish = form.get('togglePublish')

      if (togglePublish === 'true') {
        if (existing.listingStatus === 'REJECTED') {
          return apiError('Toko ditolak. Edit dan kirim ulang untuk review admin.')
        }
        if (existing.listingStatus === 'PENDING') {
          return apiError('Toko masih menunggu review admin.')
        }
        if (existing.listingStatus !== 'APPROVED') {
          return apiError('Toko harus disetujui admin sebelum dipublikasikan.')
        }
        data.isPublished = !existing.isPublished
      } else {
        const parsed = storeFieldsSchema.safeParse(readStoreFieldsFromFormData(form))
        if (!parsed.success) {
          return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
        }
        const payload = parseStoreFormPayload(parsed.data)
        Object.assign(data, payload)
      }

      const file = form.get('cover')
      if (file instanceof File && file.size > 0) {
        const coverImage = await saveStoreCover(file, session.user.id)
        await deleteStoreCover(existing.coverImage)
        data.coverImage = coverImage
      }
    } else {
      const body = await req.json()
      if (body.togglePublish === true) {
        if (existing.listingStatus === 'REJECTED') {
          return apiError('Toko ditolak. Edit dan kirim ulang untuk review admin.')
        }
        if (existing.listingStatus === 'PENDING') {
          return apiError('Toko masih menunggu review admin.')
        }
        if (existing.listingStatus !== 'APPROVED') {
          return apiError('Toko harus disetujui admin sebelum dipublikasikan.')
        }
        data.isPublished = !existing.isPublished
      } else {
        const parsed = storeFieldsSchema.partial().safeParse(body)
        if (!parsed.success) {
          return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
        }
        const payload = parseStoreFormPayload(parsed.data as Parameters<typeof parseStoreFormPayload>[0])
        Object.assign(data, payload)
      }
    }

    if (hasContentFieldUpdate(data) && existing.listingStatus === 'REJECTED') {
      data.listingStatus = 'PENDING'
      data.isPublished = false
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
