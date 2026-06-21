import 'server-only'

import { prisma } from '@/lib/db'
import type { LandingPublicStats } from '@/lib/landing-public-stats-shared'

export type { LandingPublicStats } from '@/lib/landing-public-stats-shared'
export { LANDING_TRUST_STAT_MIN } from '@/lib/landing-public-stats-shared'

const SOLD_ORDER_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'] as const

export async function getLandingPublicStats(): Promise<LandingPublicStats> {
  const [
    soldItems,
    teknisiTerverifikasi,
    iklanTayang,
    teknisiReviewAgg,
    productReviewAgg,
  ] = await Promise.all([
    prisma.orderItem.aggregate({
      where: {
        order: { status: { in: [...SOLD_ORDER_STATUSES] } },
      },
      _sum: { quantity: true },
    }),
    prisma.teknisiProfile.count({
      where: {
        verificationStatus: 'APPROVED',
        isVerified: true,
      },
    }),
    prisma.product.count({
      where: {
        isPublished: true,
        listingStatus: 'APPROVED',
      },
    }),
    prisma.teknisiReview.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.productReview.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ])

  const teknisiCount = teknisiReviewAgg._count._all
  const productCount = productReviewAgg._count._all
  const reviewTotal = teknisiCount + productCount

  let ratingUser = 0
  if (reviewTotal > 0) {
    const teknisiSum = (teknisiReviewAgg._avg.rating ?? 0) * teknisiCount
    const productSum = (productReviewAgg._avg.rating ?? 0) * productCount
    ratingUser = Math.round(((teknisiSum + productSum) / reviewTotal) * 10) / 10
  }

  return {
    produkTerjual: soldItems._sum.quantity ?? 0,
    teknisiTerverifikasi,
    iklanTayang,
    ratingUser,
    ratingReviewCount: reviewTotal,
  }
}
