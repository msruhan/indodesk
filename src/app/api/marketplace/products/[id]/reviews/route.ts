import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import {
  serializeProductReview,
  syncProductRating,
} from '@/lib/product-review-server'

export const dynamic = 'force-dynamic'

const AUTHOR_SELECT = { id: true, name: true, image: true } as const

/** GET /api/marketplace/products/[id]/reviews — ulasan publik produk */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true, rating: true, reviewCount: true },
    })
    if (!product) return apiError('Produk tidak ditemukan', 404)

    const rows = await prisma.productReview.findMany({
      where: { productId },
      include: { author: { select: AUTHOR_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return apiSuccess({
      items: rows.map((r) => ({
        ...serializeProductReview(r),
        dateLabel: formatNotificationTimeLabel(r.createdAt),
      })),
      stats: {
        rating: Number(product.rating),
        reviewCount: product.reviewCount,
      },
    })
  } catch (e) {
    console.error('[PRODUCT_REVIEWS_GET]', e)
    return apiError('Gagal memuat ulasan', 500)
  }
}

/** POST /api/marketplace/products/[id]/reviews — ulasan setelah order COMPLETED */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params
  const { session, error } = await requireApiAuth()
  if (error) return error

  let body: { orderId?: string; rating?: number; comment?: string }
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid', 400)
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  const rating = Number(body.rating)
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

  if (!orderId) return apiError('Order wajib diisi', 400)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return apiError('Rating harus antara 1 dan 5', 400)
  }
  if (comment.length < 10) {
    return apiError('Ulasan minimal 10 karakter', 400)
  }
  if (comment.length > 2000) {
    return apiError('Ulasan maksimal 2000 karakter', 400)
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: session.user.id,
        status: 'COMPLETED',
        items: { some: { productId } },
      },
      select: { id: true, orderCode: true },
    })
    if (!order) {
      return apiError('Pesanan tidak ditemukan atau belum selesai', 400)
    }

    const existing = await prisma.productReview.findUnique({
      where: { orderId_productId: { orderId, productId } },
    })
    if (existing) {
      return apiError('Anda sudah memberikan ulasan untuk produk ini', 400)
    }

    const row = await prisma.productReview.create({
      data: {
        productId,
        orderId,
        authorId: session.user.id,
        rating,
        comment,
      },
      include: { author: { select: AUTHOR_SELECT } },
    })

    await syncProductRating(productId)

    return apiSuccess({
      review: serializeProductReview(row),
    })
  } catch (e) {
    console.error('[PRODUCT_REVIEWS_POST]', e)
    return apiError('Gagal menyimpan ulasan', 500)
  }
}
