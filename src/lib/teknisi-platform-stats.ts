import { prisma } from '@/lib/db'

import { calculateTeknisiPerformanceScore, type PerformanceScoreResult } from '@/lib/teknisi-performance-score'
import { fetchTeknisiUnifiedReviewStats } from '@/lib/teknisi-unified-reviews'

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

function collectResponseSampleMinutes(
  createdAt: Date,
  respondedAt: Date | null | undefined,
): number | null {
  if (!respondedAt) return null
  const mins = (respondedAt.getTime() - createdAt.getTime()) / 60_000
  if (mins >= 0 && mins < 24 * 60) return mins
  return null
}

function responseTimeLabelFromSamples(samples: number[]): string {
  if (samples.length === 0) return '—'
  const avg = samples.reduce((s, m) => s + m, 0) / samples.length
  return formatResponseMinutes(avg)
}

/** Estimasi respons per teknisi (batch) dari sesi konsultasi & remote. */
export async function getTeknisiResponseTimeLabels(
  teknisiIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(teknisiIds.filter(Boolean))]
  if (uniqueIds.length === 0) return new Map()

  const [konsultasi, remote] = await Promise.all([
    prisma.konsultasiSession.findMany({
      where: { teknisiId: { in: uniqueIds } },
      select: { teknisiId: true, createdAt: true, startedAt: true },
    }),
    prisma.remoteSession.findMany({
      where: { teknisiId: { in: uniqueIds } },
      select: { teknisiId: true, createdAt: true, acceptedAt: true },
    }),
  ])

  const samplesByTeknisi = new Map<string, number[]>()
  for (const id of uniqueIds) samplesByTeknisi.set(id, [])

  for (const k of konsultasi) {
    const mins = collectResponseSampleMinutes(k.createdAt, k.startedAt)
    if (mins != null) samplesByTeknisi.get(k.teknisiId)?.push(mins)
  }
  for (const r of remote) {
    const mins = collectResponseSampleMinutes(r.createdAt, r.acceptedAt)
    if (mins != null) samplesByTeknisi.get(r.teknisiId)?.push(mins)
  }

  const labels = new Map<string, string>()
  for (const id of uniqueIds) {
    labels.set(id, responseTimeLabelFromSamples(samplesByTeknisi.get(id) ?? []))
  }
  return labels
}

export async function getTeknisiResponseTimeLabel(teknisiId: string): Promise<string> {
  const labels = await getTeknisiResponseTimeLabels([teknisiId])
  return labels.get(teknisiId) ?? '—'
}

/** Statistik performa teknisi dihitung dari data sesi & ulasan di platform. */
export async function getTeknisiPlatformStats(teknisiId: string): Promise<TeknisiPlatformStatsDto> {
  const [konsultasi, remote, unifiedReviews, profile] = await Promise.all([
    prisma.konsultasiSession.findMany({
      where: { teknisiId },
      select: { status: true, createdAt: true, startedAt: true },
    }),
    prisma.remoteSession.findMany({
      where: { teknisiId },
      select: { status: true, createdAt: true, acceptedAt: true },
    }),
    fetchTeknisiUnifiedReviewStats(teknisiId),
    prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      select: { rating: true, reviewCount: true, totalView: true },
    }),
  ])

  const responseSamples: number[] = []
  for (const k of konsultasi) {
    const mins = collectResponseSampleMinutes(k.createdAt, k.startedAt)
    if (mins != null) responseSamples.push(mins)
  }
  for (const r of remote) {
    const mins = collectResponseSampleMinutes(r.createdAt, r.acceptedAt)
    if (mins != null) responseSamples.push(mins)
  }

  const responseTimeLabel = responseTimeLabelFromSamples(responseSamples)

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

  const reviewCount = unifiedReviews.stats.reviewCount
  const averageRating =
    reviewCount > 0
      ? unifiedReviews.stats.averageRating
      : profile
        ? Number(profile.rating)
        : 0

  const reviewRatingLabel =
    reviewCount > 0
      ? `${averageRating} · ${reviewCount} ulasan`
      : 'Belum ada ulasan'

  const ratingDistribution = buildRatingDistribution(
    unifiedReviews.ratings.map((rating) => ({ rating })),
  )

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
