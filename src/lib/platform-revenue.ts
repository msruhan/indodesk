import { prisma } from '@/lib/db'
import {
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  type PlatformRevenueChannel,
  type PlatformRevenueRecentRow,
  type PlatformRevenueSummary,
  type ChannelRevenueStats,
} from '@/lib/platform-revenue-types'

export type { PlatformRevenueSummary } from '@/lib/platform-revenue-types'

const MARKETPLACE_ESTIMATED_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED'] as const
const REKBER_ESTIMATED_STATUSES = ['HELD', 'PROCESSING', 'SHIPPED'] as const
const INSPECTION_ESTIMATED_STATUSES = ['ACCEPTED', 'IN_PROGRESS', 'REPORT_SUBMITTED'] as const

function sumDecimalPair(buyer: unknown, seller: unknown): number {
  return Number(buyer ?? 0) + Number(seller ?? 0)
}

function str(n: number): string {
  return String(Math.round(n))
}

function dayRanges(now: Date, days: number) {
  const labels: string[] = []
  const ranges: Array<{ gte: Date; lt: Date }> = []
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    labels.push(dayStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
    ranges.push({ gte: dayStart, lt: dayEnd })
  }
  return { labels, ranges }
}

async function sumMarketplaceFees(where: object): Promise<number> {
  const agg = await prisma.order.aggregate({
    _sum: { buyerFeeAmount: true, sellerFeeAmount: true },
    where,
  })
  return sumDecimalPair(agg._sum.buyerFeeAmount, agg._sum.sellerFeeAmount)
}

async function sumRekberFees(where: object): Promise<number> {
  const agg = await prisma.rekberTransaction.aggregate({
    _sum: { fee: true },
    where,
  })
  return Number(agg._sum.fee ?? 0)
}

async function sumInspectionFees(where: object): Promise<number> {
  const agg = await prisma.inspectionOrder.aggregate({
    _sum: { platformFee: true },
    where,
  })
  return Number(agg._sum.platformFee ?? 0)
}

export async function getPlatformRevenueSummary(): Promise<PlatformRevenueSummary> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOf30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const { labels: dailyLabels, ranges: dailyRanges } = dayRanges(now, 7)

  const [
    mktRealizedTotal,
    mktRealizedToday,
    mktRealized30d,
    mktEstimatedTotal,
    mktCountRealized,
    mktCountEstimated,
    rekRealizedTotal,
    rekRealizedToday,
    rekRealized30d,
    rekEstimatedTotal,
    rekCountRealized,
    rekCountEstimated,
    inspRealizedTotal,
    inspRealizedToday,
    inspRealized30d,
    inspEstimatedTotal,
    inspCountRealized,
    inspCountEstimated,
    konsCountRealized,
    konsGmvRealized,
    ...dailyResults
  ] = await Promise.all([
    sumMarketplaceFees({ status: 'COMPLETED' }),
    sumMarketplaceFees({ status: 'COMPLETED', completedAt: { gte: startOfToday } }),
    sumMarketplaceFees({ status: 'COMPLETED', completedAt: { gte: startOf30d } }),
    sumMarketplaceFees({ status: { in: [...MARKETPLACE_ESTIMATED_STATUSES] } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.count({ where: { status: { in: [...MARKETPLACE_ESTIMATED_STATUSES] } } }),
    sumRekberFees({ status: 'RELEASED' }),
    sumRekberFees({ status: 'RELEASED', releasedAt: { gte: startOfToday } }),
    sumRekberFees({ status: 'RELEASED', releasedAt: { gte: startOf30d } }),
    sumRekberFees({ status: { in: [...REKBER_ESTIMATED_STATUSES] } }),
    prisma.rekberTransaction.count({ where: { status: 'RELEASED' } }),
    prisma.rekberTransaction.count({ where: { status: { in: [...REKBER_ESTIMATED_STATUSES] } } }),
    sumInspectionFees({ status: 'COMPLETED' }),
    sumInspectionFees({ status: 'COMPLETED', completedAt: { gte: startOfToday } }),
    sumInspectionFees({ status: 'COMPLETED', completedAt: { gte: startOf30d } }),
    sumInspectionFees({ status: { in: [...INSPECTION_ESTIMATED_STATUSES] } }),
    prisma.inspectionOrder.count({ where: { status: 'COMPLETED' } }),
    prisma.inspectionOrder.count({ where: { status: { in: [...INSPECTION_ESTIMATED_STATUSES] } } }),
    prisma.konsultasiSession.count({ where: { status: 'COMPLETED' } }),
    prisma.konsultasiSession.aggregate({
      _sum: { price: true },
      where: { status: 'COMPLETED' },
    }),
    ...dailyRanges.flatMap((range) => [
      sumMarketplaceFees({ status: 'COMPLETED', completedAt: range }),
      sumRekberFees({ status: 'RELEASED', releasedAt: range }),
      sumInspectionFees({ status: 'COMPLETED', completedAt: range }),
    ]),
  ])

  const konsGmv = Number(konsGmvRealized._sum.price ?? 0)

  const dailyMarketplace: number[] = []
  const dailyRekber: number[] = []
  const dailyInspeksi: number[] = []
  for (let i = 0; i < 7; i++) {
    const offset = i * 3
    dailyMarketplace.push(dailyResults[offset] as number)
    dailyRekber.push(dailyResults[offset + 1] as number)
    dailyInspeksi.push(dailyResults[offset + 2] as number)
  }

  const realizedTotal =
    mktRealizedTotal + rekRealizedTotal + inspRealizedTotal
  const realizedToday =
    mktRealizedToday + rekRealizedToday + inspRealizedToday
  const realized30d =
    mktRealized30d + rekRealized30d + inspRealized30d
  const estimatedTotal =
    mktEstimatedTotal + rekEstimatedTotal + inspEstimatedTotal

  const byChannel: Record<PlatformRevenueChannel, ChannelRevenueStats> = {
    marketplace: {
      realized: str(mktRealizedTotal),
      estimated: str(mktEstimatedTotal),
      countRealized: mktCountRealized,
      countEstimated: mktCountEstimated,
    },
    rekber: {
      realized: str(rekRealizedTotal),
      estimated: str(rekEstimatedTotal),
      countRealized: rekCountRealized,
      countEstimated: rekCountEstimated,
    },
    inspeksi: {
      realized: str(inspRealizedTotal),
      estimated: str(inspEstimatedTotal),
      countRealized: inspCountRealized,
      countEstimated: inspCountEstimated,
    },
    konsultasi: {
      realized: '0',
      estimated: '0',
      countRealized: konsCountRealized,
      countEstimated: 0,
      gmvRealized: str(konsGmv),
      note: 'Fee platform belum dikenakan — 100% ke teknisi',
    },
  }

  const mixAmounts = (
    [
      { channel: 'marketplace' as const, amount: mktRealizedTotal },
      { channel: 'rekber' as const, amount: rekRealizedTotal },
      { channel: 'inspeksi' as const, amount: inspRealizedTotal },
    ] as const
  ).filter((x) => x.amount > 0)

  const mixTotal = mixAmounts.reduce((s, x) => s + x.amount, 0)
  const mix = mixAmounts.map((x) => ({
    channel: x.channel,
    label: CHANNEL_LABELS[x.channel],
    amount: str(x.amount),
    color: CHANNEL_COLORS[x.channel],
    value: mixTotal > 0 ? Math.round((x.amount / mixTotal) * 100) : 0,
  }))

  const [
    recentMarketplaceCompleted,
    recentMarketplaceEstimated,
    recentRekberReleased,
    recentRekberHeld,
    recentInspectionCompleted,
    recentInspectionProgress,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'COMPLETED', OR: [{ buyerFeeAmount: { gt: 0 } }, { sellerFeeAmount: { gt: 0 } }] },
      orderBy: { completedAt: 'desc' },
      take: 8,
      select: { id: true, orderCode: true, buyerFeeAmount: true, sellerFeeAmount: true, completedAt: true },
    }),
    prisma.order.findMany({
      where: {
        status: { in: [...MARKETPLACE_ESTIMATED_STATUSES] },
        OR: [{ buyerFeeAmount: { gt: 0 } }, { sellerFeeAmount: { gt: 0 } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, orderCode: true, buyerFeeAmount: true, sellerFeeAmount: true, createdAt: true },
    }),
    prisma.rekberTransaction.findMany({
      where: { status: 'RELEASED', fee: { gt: 0 } },
      orderBy: { releasedAt: 'desc' },
      take: 8,
      select: { id: true, orderCode: true, fee: true, releasedAt: true },
    }),
    prisma.rekberTransaction.findMany({
      where: { status: { in: [...REKBER_ESTIMATED_STATUSES] }, fee: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, orderCode: true, fee: true, updatedAt: true },
    }),
    prisma.inspectionOrder.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 8,
      select: { id: true, orderCode: true, platformFee: true, completedAt: true },
    }),
    prisma.inspectionOrder.findMany({
      where: { status: { in: [...INSPECTION_ESTIMATED_STATUSES] } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, orderCode: true, platformFee: true, updatedAt: true },
    }),
  ])

  const recent: PlatformRevenueRecentRow[] = [
    ...recentMarketplaceCompleted.map((o) => ({
      id: o.id,
      channel: 'marketplace' as const,
      orderCode: o.orderCode,
      fee: str(sumDecimalPair(o.buyerFeeAmount, o.sellerFeeAmount)),
      phase: 'realized' as const,
      occurredAt: (o.completedAt ?? new Date()).toISOString(),
      href: '/admin/transactions?type=marketplace',
    })),
    ...recentMarketplaceEstimated.map((o) => ({
      id: o.id,
      channel: 'marketplace' as const,
      orderCode: o.orderCode,
      fee: str(sumDecimalPair(o.buyerFeeAmount, o.sellerFeeAmount)),
      phase: 'estimated' as const,
      occurredAt: o.createdAt.toISOString(),
      href: '/admin/transactions?type=marketplace',
    })),
    ...recentRekberReleased.map((o) => ({
      id: o.id,
      channel: 'rekber' as const,
      orderCode: o.orderCode,
      fee: o.fee.toString(),
      phase: 'realized' as const,
      occurredAt: (o.releasedAt ?? new Date()).toISOString(),
      href: '/admin/rekber',
    })),
    ...recentRekberHeld.map((o) => ({
      id: o.id,
      channel: 'rekber' as const,
      orderCode: o.orderCode,
      fee: o.fee.toString(),
      phase: 'estimated' as const,
      occurredAt: o.updatedAt.toISOString(),
      href: '/admin/rekber',
    })),
    ...recentInspectionCompleted.map((o) => ({
      id: o.id,
      channel: 'inspeksi' as const,
      orderCode: o.orderCode,
      fee: o.platformFee.toString(),
      phase: 'realized' as const,
      occurredAt: (o.completedAt ?? new Date()).toISOString(),
      href: '/admin/inspeksi',
    })),
    ...recentInspectionProgress.map((o) => ({
      id: o.id,
      channel: 'inspeksi' as const,
      orderCode: o.orderCode,
      fee: o.platformFee.toString(),
      phase: 'estimated' as const,
      occurredAt: o.updatedAt.toISOString(),
      href: '/admin/inspeksi',
    })),
  ]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 20)

  return {
    realized: {
      total: str(realizedTotal),
      today: str(realizedToday),
      last30d: str(realized30d),
    },
    estimated: { total: str(estimatedTotal) },
    byChannel,
    charts: {
      mix: mix.map(({ channel, label, amount, color }) => ({ channel, label, amount, color })),
      daily: {
        labels: dailyLabels,
        marketplace: dailyMarketplace,
        rekber: dailyRekber,
        inspeksi: dailyInspeksi,
      },
    },
    recent,
  }
}

