import { prisma } from '@/lib/db'

export type ProductReviewDto = {
  id: string
  productId: string
  orderId: string
  rating: number
  comment: string
  createdAt: string
  author: {
    id: string
    name: string
    image: string | null
  }
}

type ReviewRow = {
  id: string
  productId: string
  orderId: string
  rating: number
  comment: string
  createdAt: Date
  author: { id: string; name: string; image: string | null }
}

export function serializeProductReview(row: ReviewRow): ProductReviewDto {
  return {
    id: row.id,
    productId: row.productId,
    orderId: row.orderId,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.author.id,
      name: row.author.name,
      image: row.author.image,
    },
  }
}

export async function syncProductRating(productId: string): Promise<void> {
  const agg = await prisma.productReview.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  })

  const avg = agg._avg.rating ?? 0
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round(avg * 100) / 100,
      reviewCount: agg._count.id,
    },
  })
}
