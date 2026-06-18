export const TEKNISI_REVIEW_TAGS = [
  'Fast response',
  'Good communication',
  'Problem solved',
  'Recommended',
  'Professional',
] as const

export type TeknisiReviewTag = (typeof TEKNISI_REVIEW_TAGS)[number]

export type TeknisiReviewDto = {
  id: string
  authorId: string
  authorName: string
  authorImage: string | null
  rating: number
  tag: string | null
  comment: string
  createdAt: string
  dateLabel: string
}

export type TeknisiReviewStatsDto = {
  averageRating: number
  reviewCount: number
  breakdown: Array<{ stars: number; percent: number; count: number }>
}

export type TeknisiReviewSource = 'KONSULTASI' | 'INSPEKSI' | 'MARKETPLACE'

export type TeknisiUnifiedReviewDto = {
  id: string
  source: TeknisiReviewSource
  sourceLabel: string
  authorId: string
  authorName: string
  authorImage: string | null
  rating: number
  comment: string
  contextLabel: string
  createdAt: string
  dateLabel: string
  verified: true
}

export function computeReviewStats(
  reviews: Array<{ rating: number }>,
): TeknisiReviewStatsDto {
  const reviewCount = reviews.length
  if (reviewCount === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
      breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, percent: 0, count: 0 })),
    }
  }

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
  let sum = 0
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)))
    counts[star] = (counts[star] ?? 0) + 1
    sum += r.rating
  }

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = counts[stars] ?? 0
    return {
      stars,
      count,
      percent: Math.round((count / reviewCount) * 100),
    }
  })

  return {
    averageRating: Math.round((sum / reviewCount) * 10) / 10,
    reviewCount,
    breakdown: breakdown.filter((b) => b.stars >= 3),
  }
}

export function isValidReviewTag(tag: string | null | undefined): tag is TeknisiReviewTag | null {
  if (tag == null || tag === '') return true
  return (TEKNISI_REVIEW_TAGS as readonly string[]).includes(tag)
}
