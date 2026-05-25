import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import {
  computeReviewStats,
  isValidReviewTag,
  TEKNISI_REVIEW_TAGS,
} from '@/lib/teknisi-review'
import {
  serializeTeknisiReview,
  syncTeknisiProfileRating,
} from '@/lib/teknisi-review-server'

export const dynamic = 'force-dynamic'

/** GET /api/teknisi/[id]/reviews — daftar ulasan + statistik */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teknisiId } = await params

  try {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      select: { id: true },
    })
    if (!profile) return apiError('Teknisi tidak ditemukan', 404)

    const rows = await prisma.teknisiReview.findMany({
      where: { teknisiId },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const items = rows.map(serializeTeknisiReview)
    const stats = computeReviewStats(rows)

    const session = await auth()
    let myReview: ReturnType<typeof serializeTeknisiReview> | null = null
    if (session?.user?.id) {
      const mine = rows.find((r) => r.authorId === session.user!.id)
      if (mine) myReview = serializeTeknisiReview(mine)
    }

    return apiSuccess({
      items,
      stats,
      tags: TEKNISI_REVIEW_TAGS,
      myReview,
    })
  } catch (e) {
    console.error('[TEKNISI_REVIEWS_GET]', e)
    return apiError('Gagal memuat ulasan', 500)
  }
}

/** POST /api/teknisi/[id]/reviews — buat atau perbarui ulasan (user login / Google) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teknisiId } = await params
  const { session, error } = await requireApiAuth()
  if (error) return error

  if (session.user.id === teknisiId) {
    return apiError('Anda tidak dapat mengulas profil sendiri', 400)
  }

  let body: { rating?: number; tag?: string; comment?: string }
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid', 400)
  }

  const rating = Number(body.rating)
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
  const tag = typeof body.tag === 'string' ? body.tag.trim() : null

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return apiError('Rating harus antara 1 dan 5', 400)
  }
  if (comment.length < 10) {
    return apiError('Ulasan minimal 10 karakter', 400)
  }
  if (comment.length > 2000) {
    return apiError('Ulasan maksimal 2000 karakter', 400)
  }
  if (!isValidReviewTag(tag || null)) {
    return apiError('Tag ulasan tidak valid', 400)
  }

  try {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      select: { id: true },
    })
    if (!profile) return apiError('Teknisi tidak ditemukan', 404)

    const row = await prisma.teknisiReview.upsert({
      where: {
        teknisiId_authorId: { teknisiId, authorId: session.user.id },
      },
      create: {
        teknisiId,
        authorId: session.user.id,
        rating,
        tag: tag || null,
        comment,
      },
      update: {
        rating,
        tag: tag || null,
        comment,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    })

    await syncTeknisiProfileRating(teknisiId)

    const allRows = await prisma.teknisiReview.findMany({
      where: { teknisiId },
      select: { rating: true },
    })

    return apiSuccess({
      review: serializeTeknisiReview(row),
      stats: computeReviewStats(allRows),
    })
  } catch (e) {
    console.error('[TEKNISI_REVIEWS_POST]', e)
    return apiError('Gagal menyimpan ulasan', 500)
  }
}
