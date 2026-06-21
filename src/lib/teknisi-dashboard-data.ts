import { prisma } from '@/lib/db'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import {
  resolveTeknisiBadge,
  teknisiBadgeInputFromProfile,
  type TeknisiBadgeTier,
} from '@/lib/teknisi-badge'
import { syncTeknisiCompletedSessions } from '@/lib/teknisi-stats-server'
import type { TeknisiDigitalIdSource } from '@/lib/teknisi-digital-id'
import {
  buildTeknisiWeeklyEarnings,
  computeEarningsWowPercent,
  type TeknisiWeeklyEarningsRow,
} from '@/lib/teknisi-earnings-weekly'
import {
  evaluateTeknisiProfileCompletion,
  type ProfileCompletionStatus,
} from '@/lib/profile-completion'

export type TeknisiDashboardDto = {
  digitalId: TeknisiDigitalIdSource
  trust: {
    badge: TeknisiBadgeTier
    isVerified: boolean
    isOnline: boolean
  }
  profile: {
    name: string
    totalView: number
    totalKonsultasi: number
    totalProductViews: number
    totalProductSold: number
    rating: number
    reviewCount: number
    saldo: number
  }
  serviceMix: Array<{ name: string; value: number; color: string }>
  earningsWeekly: TeknisiWeeklyEarningsRow[]
  earningsWowPercent: number | null
  recentOrders: Array<{
    id: string
    orderCode: string
    service: string
    user: string
    amount: number
    status: 'completed' | 'pending' | 'in-progress'
    date: string
  }>
  marketplacePending: number
  profileCompletion: ProfileCompletionStatus
}

export async function getTeknisiDashboardData(teknisiId: string): Promise<TeknisiDashboardDto> {
  const now = new Date()

  const [
    user,
    profile,
    wallet,
    portfolioCount,
    konsultasi,
    remote,
    marketplaceOrders,
    earningsLedger,
    completedKonsultasi,
    completedRemoteRows,
    productAgg,
  ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: teknisiId },
        select: { name: true, createdAt: true, phone: true },
      }),
      prisma.teknisiProfile.findUnique({ where: { userId: teknisiId } }),
      prisma.wallet.findUnique({ where: { userId: teknisiId } }),
      prisma.teknisiPortfolioCase.count({ where: { teknisiId } }),
      prisma.konsultasiSession.findMany({
        where: { teknisiId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.remoteSession.findMany({
        where: { teknisiId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.order.findMany({
        where: { sellerId: teknisiId },
        include: { buyer: { select: { name: true } }, items: { include: { product: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.walletLedger.findMany({
        where: { type: 'EARNING', wallet: { userId: teknisiId } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.konsultasiSession.findMany({
        where: { teknisiId, status: 'COMPLETED' },
        select: { id: true, price: true, endedAt: true },
      }),
      prisma.remoteSession.findMany({
        where: { teknisiId, status: 'COMPLETED' },
        select: { completedAt: true },
      }),
      prisma.product.aggregate({
        where: { sellerId: teknisiId },
        _sum: { views: true, soldCount: true },
      }),
    ])

  const marketplacePending = marketplaceOrders.filter((o) =>
    ['PAID', 'PROCESSING', 'SHIPPED'].includes(o.status),
  ).length

  const konsultasiCount = await prisma.konsultasiSession.count({ where: { teknisiId } })
  const remoteCount = await prisma.remoteSession.count({ where: { teknisiId } })
  const marketplaceCount = await prisma.order.count({ where: { sellerId: teknisiId } })
  const totalServices = konsultasiCount + remoteCount + marketplaceCount || 1

  const serviceMix = [
    { name: 'Konsultasi', value: Math.round((konsultasiCount / totalServices) * 100), color: '#10b981' },
    { name: 'Remote', value: Math.round((remoteCount / totalServices) * 100), color: '#06b6d4' },
    { name: 'Marketplace', value: Math.round((marketplaceCount / totalServices) * 100), color: '#8b5cf6' },
  ].filter((x) => x.value > 0)

  const earningsWeekly = buildTeknisiWeeklyEarnings({
    now,
    ledgerEarnings: earningsLedger,
    completedKonsultasi,
    completedRemote: completedRemoteRows,
  })
  const earningsWowPercent = computeEarningsWowPercent(earningsWeekly)

  type Row = TeknisiDashboardDto['recentOrders'][0] & { sortAt: Date }

  const rows: Row[] = [
    ...konsultasi.map((k) => ({
      id: k.id,
      orderCode: `KON-${k.id.slice(-6).toUpperCase()}`,
      service: k.service,
      user: k.user.name ?? 'User',
      amount: Number(k.price),
      status:
        k.status === 'COMPLETED'
          ? ('completed' as const)
          : k.status === 'PENDING'
            ? ('pending' as const)
            : ('in-progress' as const),
      date: formatNotificationTimeLabel(k.createdAt),
      sortAt: k.createdAt,
    })),
    ...remote.map((r) => ({
      id: r.id,
      orderCode: r.remoteId,
      service: 'Remote',
      user: r.user.name ?? 'User',
      amount: 0,
      status:
        r.status === 'COMPLETED'
          ? ('completed' as const)
          : r.status === 'WAITING'
            ? ('pending' as const)
            : ('in-progress' as const),
      date: formatNotificationTimeLabel(r.createdAt),
      sortAt: r.createdAt,
    })),
    ...marketplaceOrders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      service: o.items[0]?.product.name ?? 'Marketplace',
      user: o.buyer.name ?? 'User',
      amount: Number(o.total),
      status:
        o.status === 'COMPLETED'
          ? ('completed' as const)
          : o.status === 'PAID'
            ? ('pending' as const)
            : ('in-progress' as const),
      date: formatNotificationTimeLabel(o.createdAt),
      sortAt: o.createdAt,
    })),
  ]

  const completedSessions = completedKonsultasi.length + completedRemoteRows.length
  if (profile) {
    await syncTeknisiCompletedSessions(teknisiId)
  }

  const badge = profile
    ? resolveTeknisiBadge({
        ...teknisiBadgeInputFromProfile(profile),
        completedSessions,
      })
    : 'newbie'

  const digitalId: TeknisiDigitalIdSource = {
    id: teknisiId,
    name: user?.name ?? 'Teknisi',
    specialty: profile?.specialty ?? [],
    badge,
    isVerified: profile?.isVerified ?? false,
    memberSinceAt: (user?.createdAt ?? profile?.createdAt ?? new Date()).toISOString(),
  }

  const profileCompletion = evaluateTeknisiProfileCompletion({
    phone: user?.phone ?? null,
    location: profile?.location ?? null,
    description: profile?.description ?? null,
    specialty: profile?.specialty ?? [],
    portfolioCount,
  })

  return {
    digitalId,
    trust: {
      badge,
      isVerified: profile?.isVerified ?? false,
      isOnline: profile?.isOnline ?? false,
    },
    profile: {
      name: user?.name ?? 'Teknisi',
      totalView: profile?.totalView ?? 0,
      totalKonsultasi: completedSessions,
      totalProductViews: productAgg._sum.views ?? 0,
      totalProductSold: productAgg._sum.soldCount ?? 0,
      rating: profile ? Number(profile.rating) : 0,
      reviewCount: profile?.reviewCount ?? 0,
      saldo: wallet ? Number(wallet.balance) : 0,
    },
    serviceMix,
    earningsWeekly,
    earningsWowPercent,
    recentOrders: rows.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime()).slice(0, 8).map(({ sortAt: _s, ...r }) => r),
    marketplacePending,
    profileCompletion,
  }
}
