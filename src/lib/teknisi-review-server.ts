import 'server-only'

import type { TeknisiReview, User } from '@prisma/client'
import { prisma } from '@/lib/db'
import { computeReviewStats } from '@/lib/teknisi-review'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import type { TeknisiReviewDto } from '@/lib/teknisi-review'

type ReviewRow = TeknisiReview & {
  author: Pick<User, 'id' | 'name' | 'image'>
}

export function serializeTeknisiReview(row: ReviewRow): TeknisiReviewDto {
  return {
    id: row.id,
    authorId: row.author.id,
    authorName: row.author.name,
    authorImage: row.author.image,
    rating: row.rating,
    tag: row.tag,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    dateLabel: formatNotificationTimeLabel(row.createdAt),
  }
}

/** Sinkronkan rating & reviewCount di TeknisiProfile dari ulasan aktual. */
export async function syncTeknisiProfileRating(teknisiId: string) {
  const profile = await prisma.teknisiProfile.findUnique({
    where: { userId: teknisiId },
    select: { id: true },
  })
  if (!profile) return

  const reviews = await prisma.teknisiReview.findMany({
    where: { teknisiId },
    select: { rating: true },
  })

  const stats = computeReviewStats(reviews)
  await prisma.teknisiProfile.update({
    where: { id: profile.id },
    data: {
      reviewCount: stats.reviewCount,
      rating: stats.averageRating,
    },
  })
  const { syncTeknisiCompletedSessions } = await import('@/lib/teknisi-stats-server')
  await syncTeknisiCompletedSessions(teknisiId)
}
