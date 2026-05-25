import { prisma } from '@/lib/db'

import { calculateTeknisiPerformanceScore, type PerformanceScoreResult } from '@/lib/teknisi-performance-score'

export type RatingDistributionRow = {
  star: number
  count: number
  percent: number
}

export type TeknisiPlatformStatsDto = {
  responseTimeLabel: string
  completionRatePercent: number
  completedSessions: number
  reviewRatingLabel: string
  averageRating: number
  reviewCount: number
  ratingDistribution: RatingDistributionRow[]
  repeatCustomerPercent: number | null
  performanceIndicator: PerformanceScoreResult
}

function buildRatingDistribution(reviews: { rating: number }[]): RatingDistributionRow[] {
  const counts = [0, 0, 0, 0, 0, 0] // index 1–5
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)))
    counts[star] += 1
  }
  const total = reviews.length
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: counts[star],
    percent: total > 0 ? Math.round((counts[star] / total) * 100) : 0,
  }))
}

function formatResponseMinutes(avgMinutes: number): string {
  if (avgMinutes < 1) return '< 1 menit'
  if (avgMinutes < 60) return `< ${Math.max(1, Math.ceil(avgMinutes))} menit`
  const hours = Math.round(avgMinutes / 60)
  return `~${hours} jam`
}

/** Statistik performa teknisi dihitung dari data sesi & ulasan di platform. */
export async function getTeknisiPlatformStats(teknisiId: string): Promise<TeknisiPlatformStatsDto> {
  const [konsultasi, remote, reviews, profile] = await Promise.all([
    prisma.konsultasiSession.findMany({
      where: { teknisiId },
      select: { status: true, createdAt: true, startedAt: true },
    }),
    prisma.remoteSession.findMany({
      where: { teknisiId },
      select: { status: true, createdAt: true, acceptedAt: true },
    }),
    prisma.teknisiReview.findMany({
      where: { teknisiId },
      select: { rating: true },
    }),
    prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      select: { rating: true, reviewCount: true, totalView: true },
    }),
  ])

  const responseSamples: number[] = []
  for (const k of konsultasi) {
    if (!k.startedAt) continue
    const mins = (k.startedAt.getTime() - k.createdAt.getTime()) / 60_000
    if (mins >= 0 && mins < 24 * 60) responseSamples.push(mins)
  }
  for (const r of remote) {
    if (!r.acceptedAt) continue
    const mins = (r.acceptedAt.getTime() - r.createdAt.getTime()) / 60_000
    if (mins >= 0 && mins < 24 * 60) responseSamples.push(mins)
  }

  const responseTimeLabel =
    responseSamples.length > 0
      ? formatResponseMinutes(
          responseSamples.reduce((s, m) => s + m, 0) / responseSamples.length,
        )
      : '—'

  const averageResponseMinutes =
    responseSamples.length > 0
      ? responseSamples.reduce((s, m) => s + m, 0) / responseSamples.length
      : null

  const konsultasiDone = konsultasi.filter((k) => k.status === 'COMPLETED').length
  const remoteDone = remote.filter((r) => r.status === 'COMPLETED').length
  const completedSessions = konsultasiDone + remoteDone

  const totalSessions = konsultasi.length + remote.length
  const completionRatePercent =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0

  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
      : profile
        ? Number(profile.rating)
        : 0

  const reviewRatingLabel =
    reviewCount > 0
      ? `${averageRating} · ${reviewCount} ulasan`
      : 'Belum ada ulasan'

  const ratingDistribution = buildRatingDistribution(reviews)

  const completedByUser = await prisma.konsultasiSession.groupBy({
    by: ['userId'],
    where: { teknisiId, status: 'COMPLETED' },
    _count: { userId: true },
  })
  const repeatCustomerPercent =
    completedByUser.length > 0
      ? Math.round(
          (completedByUser.filter((g) => g._count.userId > 1).length / completedByUser.length) * 100,
        )
      : null

  const performanceIndicator = calculateTeknisiPerformanceScore({
    completionRatePercent,
    completedSessions,
    totalSessions,
    averageResponseMinutes,
    totalView: profile?.totalView ?? 0,
  })

  return {
    responseTimeLabel,
    completionRatePercent,
    completedSessions,
    reviewRatingLabel,
    averageRating,
    reviewCount,
    ratingDistribution,
    repeatCustomerPercent,
    performanceIndicator,
  }
}
