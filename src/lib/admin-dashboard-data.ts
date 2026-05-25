import { prisma } from '@/lib/db'
import { formatNotificationTimeLabel } from '@/lib/notification-display'

export type AdminDashboardDto = {
  stats: {
    totalUsers: number
    totalTeknisi: number
    totalTransaksi: number
    totalKonsultasi: number
    pendingApprovals: number
    rekberHeld: number
  }
  sparklines: {
    users: number[]
    teknisi: number[]
    transaksi: number[]
    konsultasi: number[]
  }
  charts: {
    revenueLabels: string[]
    revenueJt: number[]
    transactionCounts: number[]
    transactionMix: Array<{ name: string; value: number; color: string }>
    topProducts: Array<{ name: string; sales: number }>
    funnel: Array<{ stage: string; value: number }>
  }
  recentOrders: Array<{
    id: string
    orderCode: string
    user: string
    amount: number
    status: 'completed' | 'pending' | 'in-progress'
    date: string
    href: string
  }>
  insights: Array<{
    title: string
    description: string
    tone: 'primary' | 'warning' | 'danger' | 'neutral'
  }>
  updatedAt: string
}

function mapMarketplaceStatus(
  status: string,
): 'completed' | 'pending' | 'in-progress' {
  if (status === 'COMPLETED') return 'completed'
  if (status === 'PENDING' || status === 'PAID') return 'pending'
  return 'in-progress'
}

function mapImeiStatus(status: string): 'completed' | 'pending' | 'in-progress' {
  if (status === 'SUCCESS') return 'completed'
  if (status === 'PENDING') return 'pending'
  return 'in-progress'
}

export async function getAdminDashboardData(): Promise<AdminDashboardDto> {
  const now = new Date()

  const [
    totalUsers,
    totalTeknisi,
    totalImei,
    totalServer,
    totalMarketplace,
    totalTopup,
    totalRekber,
    totalKonsultasi,
    totalRemote,
    pendingProducts,
    pendingStores,
    unverifiedTeknisi,
    rekberHeld,
    topProducts,
    recentMarketplace,
    recentImei,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'TEKNISI' } }),
    prisma.imeiOrder.count(),
    prisma.serverOrder.count(),
    prisma.order.count(),
    prisma.topupOrder.count(),
    prisma.rekberTransaction.count(),
    prisma.konsultasiSession.count(),
    prisma.remoteSession.count(),
    prisma.product.count({ where: { listingStatus: 'PENDING' } }),
    prisma.teknisiStore.count({ where: { listingStatus: 'PENDING' } }),
    prisma.teknisiProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.rekberTransaction.count({ where: { status: 'HELD' } }),
    prisma.product.findMany({
      where: { soldCount: { gt: 0 } },
      orderBy: { soldCount: 'desc' },
      take: 6,
      select: { name: true, soldCount: true },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { buyer: { select: { name: true } } },
    }),
    prisma.imeiOrder.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ])

  const totalTransaksi =
    totalImei + totalServer + totalMarketplace + totalTopup + totalRekber
  const totalKonsultasiAll = totalKonsultasi + totalRemote
  const pendingApprovals = pendingProducts + pendingStores + unverifiedTeknisi

  const revenueLabels: string[] = []
  const revenueJt: number[] = []
  const transactionCounts: number[] = []
  const usersDaily: number[] = []
  const teknisiDaily: number[] = []
  const konsultasiDaily: number[] = []

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const range = { gte: dayStart, lt: dayEnd }

    revenueLabels.push(dayStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))

    const [imeiC, serverC, marketC, imeiRev, serverRev, marketRev, konsC, remoteC, newUsers] =
      await Promise.all([
        prisma.imeiOrder.count({ where: { createdAt: range } }),
        prisma.serverOrder.count({ where: { createdAt: range } }),
        prisma.order.count({ where: { createdAt: range } }),
        prisma.imeiOrder.aggregate({
          _sum: { price: true },
          where: { createdAt: range, status: 'SUCCESS' },
        }),
        prisma.serverOrder.aggregate({
          _sum: { price: true },
          where: { createdAt: range, status: 'SUCCESS' },
        }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { createdAt: range, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'] } },
        }),
        prisma.konsultasiSession.count({ where: { createdAt: range } }),
        prisma.remoteSession.count({ where: { createdAt: range } }),
        prisma.user.count({ where: { role: 'USER', createdAt: range } }),
      ])

    const dayRevenue =
      Number(imeiRev._sum.price ?? 0) +
      Number(serverRev._sum.price ?? 0) +
      Number(marketRev._sum.total ?? 0)
    revenueJt.push(Math.round((dayRevenue / 1_000_000) * 10) / 10)
    transactionCounts.push(imeiC + serverC + marketC)
    usersDaily.push(newUsers)
    teknisiDaily.push(0)
    konsultasiDaily.push(konsC + remoteC)
  }

  const totalForMix = totalImei + totalServer + totalMarketplace + totalTopup + totalRekber || 1
  const transactionMix = [
    { name: 'Marketplace', value: Math.round((totalMarketplace / totalForMix) * 100), color: '#8b5cf6' },
    { name: 'IMEI', value: Math.round((totalImei / totalForMix) * 100), color: '#10b981' },
    { name: 'Server', value: Math.round((totalServer / totalForMix) * 100), color: '#06b6d4' },
    { name: 'Top Up', value: Math.round((totalTopup / totalForMix) * 100), color: '#f59e0b' },
    { name: 'Rekber', value: Math.round((totalRekber / totalForMix) * 100), color: '#ec4899' },
  ].filter((x) => x.value > 0)

  const productViews = await prisma.product.aggregate({ _sum: { views: true } })
  const completedMarketplace = await prisma.order.count({ where: { status: 'COMPLETED' } })
  const imeiSuccess = await prisma.imeiOrder.count({ where: { status: 'SUCCESS' } })

  const funnel = [
    { stage: 'Kunjungan produk', value: productViews._sum.views ?? 0 },
    { stage: 'Order dibuat', value: totalTransaksi },
    { stage: 'IMEI/Server sukses', value: imeiSuccess },
    { stage: 'Marketplace selesai', value: completedMarketplace },
  ]

  const recentOrders = [
    ...recentMarketplace.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      user: o.buyer.name ?? 'User',
      amount: Number(o.total),
      status: mapMarketplaceStatus(o.status),
      date: formatNotificationTimeLabel(o.createdAt),
      createdAt: o.createdAt,
      href: '/admin/transactions?type=marketplace',
    })),
    ...recentImei.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      user: o.user.name ?? 'User',
      amount: Number(o.price),
      status: mapImeiStatus(o.status),
      date: formatNotificationTimeLabel(o.createdAt),
      createdAt: o.createdAt,
      href: '/admin/transactions?type=imei',
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map(({ createdAt: _c, ...rest }) => rest)

  const insights: AdminDashboardDto['insights'] = []

  if (pendingApprovals > 0) {
    insights.push({
      title: `${pendingApprovals} item menunggu approval`,
      description: 'Review produk, toko, dan verifikasi teknisi di halaman Approval.',
      tone: pendingApprovals > 5 ? 'warning' : 'primary',
    })
  }

  if (rekberHeld > 0) {
    insights.push({
      title: `${rekberHeld} rekber dana ditahan`,
      description: 'Pantau escrow yang perlu mediasi atau release di modul Rekber.',
      tone: 'warning',
    })
  }

  if (konsultasiDaily[konsultasiDaily.length - 1] > 0) {
    insights.push({
      title: 'Aktivitas konsultasi & remote hari ini',
      description: `${konsultasiDaily[konsultasiDaily.length - 1]} sesi baru dalam 24 jam terakhir.`,
      tone: 'primary',
    })
  }

  if (insights.length === 0) {
    insights.push({
      title: 'Operasional stabil',
      description: 'Tidak ada antrian kritis. Pantau transaksi dan chat secara berkala.',
      tone: 'neutral',
    })
  }

  return {
    stats: {
      totalUsers,
      totalTeknisi,
      totalTransaksi,
      totalKonsultasi: totalKonsultasiAll,
      pendingApprovals,
      rekberHeld,
    },
    sparklines: {
      users: usersDaily,
      teknisi: teknisiDaily.length ? teknisiDaily : usersDaily,
      transaksi: transactionCounts,
      konsultasi: konsultasiDaily,
    },
    charts: {
      revenueLabels,
      revenueJt,
      transactionCounts,
      transactionMix,
      topProducts: topProducts.map((p) => ({
        name: p.name.length > 28 ? `${p.name.slice(0, 28)}…` : p.name,
        sales: p.soldCount,
      })),
      funnel,
    },
    recentOrders,
    insights,
    updatedAt: now.toISOString(),
  }
}
