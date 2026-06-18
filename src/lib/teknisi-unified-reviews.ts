import 'server-only'

import { prisma } from '@/lib/db'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import {
  computeReviewStats,
  type TeknisiReviewStatsDto,
  type TeknisiReviewSource,
  type TeknisiUnifiedReviewDto,
} from '@/lib/teknisi-review'

export type { TeknisiReviewSource, TeknisiUnifiedReviewDto }

const SOURCE_LABELS: Record<TeknisiReviewSource, string> = {
  KONSULTASI: 'Konsultasi',
  INSPEKSI: 'Inspeksi',
  MARKETPLACE: 'Marketplace',
}

type ReviewRow = { rating: number; createdAt: Date }

export async function fetchTeknisiUnifiedReviews(
  teknisiId: string,
  limit = 50,
): Promise<TeknisiUnifiedReviewDto[]> {
  const [konsultasi, inspeksi, marketplace] = await Promise.all([
    prisma.konsultasiSession.findMany({
      where: {
        teknisiId,
        status: 'COMPLETED',
        rating: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
    prisma.inspectionOrder.findMany({
      where: {
        teknisiId,
        status: 'COMPLETED',
        ratingByUser: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
    prisma.productReview.findMany({
      where: {
        order: { sellerId: teknisiId, status: 'COMPLETED' },
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        product: { select: { name: true } },
        order: { select: { orderCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ])

  const items: TeknisiUnifiedReviewDto[] = []

  for (const row of konsultasi) {
    if (row.rating == null) continue
    const createdAt = row.endedAt ?? row.updatedAt
    items.push({
      id: `konsultasi:${row.id}`,
      source: 'KONSULTASI',
      sourceLabel: SOURCE_LABELS.KONSULTASI,
      authorId: row.user.id,
      authorName: row.user.name,
      authorImage: row.user.image,
      rating: row.rating,
      comment: row.review?.trim() || '—',
      contextLabel: row.service,
      createdAt: createdAt.toISOString(),
      dateLabel: formatNotificationTimeLabel(createdAt),
      verified: true,
    })
  }

  for (const row of inspeksi) {
    if (row.ratingByUser == null) continue
    const createdAt = row.completedAt ?? row.updatedAt
    items.push({
      id: `inspeksi:${row.id}`,
      source: 'INSPEKSI',
      sourceLabel: SOURCE_LABELS.INSPEKSI,
      authorId: row.user.id,
      authorName: row.user.name,
      authorImage: row.user.image,
      rating: row.ratingByUser,
      comment: row.reviewByUser?.trim() || '—',
      contextLabel: `${row.productName} · ${row.orderCode}`,
      createdAt: createdAt.toISOString(),
      dateLabel: formatNotificationTimeLabel(createdAt),
      verified: true,
    })
  }

  for (const row of marketplace) {
    items.push({
      id: `marketplace:${row.id}`,
      source: 'MARKETPLACE',
      sourceLabel: SOURCE_LABELS.MARKETPLACE,
      authorId: row.author.id,
      authorName: row.author.name,
      authorImage: row.author.image,
      rating: row.rating,
      comment: row.comment,
      contextLabel: `${row.product.name} · ${row.order.orderCode}`,
      createdAt: row.createdAt.toISOString(),
      dateLabel: formatNotificationTimeLabel(row.createdAt),
      verified: true,
    })
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items.slice(0, limit)
}

export async function fetchTeknisiUnifiedReviewStats(
  teknisiId: string,
): Promise<TeknisiUnifiedReviewStatsResult> {
  const [konsultasi, inspeksi, marketplace] = await Promise.all([
    prisma.konsultasiSession.findMany({
      where: { teknisiId, status: 'COMPLETED', rating: { not: null } },
      select: { rating: true, updatedAt: true, endedAt: true },
    }),
    prisma.inspectionOrder.findMany({
      where: { teknisiId, status: 'COMPLETED', ratingByUser: { not: null } },
      select: { ratingByUser: true, updatedAt: true, completedAt: true },
    }),
    prisma.productReview.findMany({
      where: { order: { sellerId: teknisiId, status: 'COMPLETED' } },
      select: { rating: true, createdAt: true },
    }),
  ])

  const rows: ReviewRow[] = [
    ...konsultasi.map((r) => ({
      rating: r.rating!,
      createdAt: r.endedAt ?? r.updatedAt,
    })),
    ...inspeksi.map((r) => ({
      rating: r.ratingByUser!,
      createdAt: r.completedAt ?? r.updatedAt,
    })),
    ...marketplace.map((r) => ({
      rating: r.rating,
      createdAt: r.createdAt,
    })),
  ]

  return {
    stats: computeReviewStats(rows),
    ratings: rows.map((r) => r.rating),
  }
}

export type TeknisiUnifiedReviewStatsResult = {
  stats: TeknisiReviewStatsDto
  ratings: number[]
}
