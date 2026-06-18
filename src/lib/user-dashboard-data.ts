import type { Wallet } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { formatMonthShortId } from '@/lib/format'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import { getUserActivityHref } from '@/lib/user-activity-href'
import { ensureUserWallet } from '@/lib/wallet/ensure-wallet'
import { listRekberTransactions } from '@/lib/rekber-query'

export type UserDashboardDto = {
  walletBalance: number
  stats: {
    totalSpent: number
    totalOrders: number
    activeKonsultasi: number
    activeRekber: number
    activeInspeksi: number
  }
  spendingByMonth: Array<{ month: string; amount: number }>
  recentActivity: Array<{
    id: string
    type: 'belanja' | 'konsultasi' | 'rekber' | 'inspeksi'
    title: string
    subtitle: string
    amount: number
    status: 'completed' | 'pending' | 'in-progress' | 'failed'
    date: string
    href: string
  }>
}

function mapKonsultasiStatus(s: string): UserDashboardDto['recentActivity'][0]['status'] {
  if (s === 'COMPLETED') return 'completed'
  if (s === 'PENDING' || s === 'AWAITING_PAYMENT') return 'pending'
  if (s === 'ACTIVE') return 'in-progress'
  return 'failed'
}

async function loadDashboardPart<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await loader()
  } catch (e) {
    console.error(`[USER_DASHBOARD] ${label}`, e)
    return fallback
  }
}

export async function getUserDashboardData(userId: string): Promise<UserDashboardDto> {
  const now = new Date()
  const wallet = await loadDashboardPart('wallet', () => ensureUserWallet(userId), {
    id: '',
    userId,
    balance: new Prisma.Decimal(0),
    createdAt: now,
    updatedAt: now,
  } satisfies Wallet)
  const balance = Number(wallet.balance)

  const [
    marketplaceOrders,
    konsultasi,
    rekber,
    inspections,
    ledgerPayments,
  ] = await Promise.all([
    loadDashboardPart('orders', () =>
      prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          seller: { select: { name: true } },
          items: {
            take: 1,
            include: { product: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    []),
    loadDashboardPart('konsultasi', () =>
      prisma.konsultasiSession.findMany({
        where: { userId },
        include: { teknisi: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    []),
    loadDashboardPart('rekber', () =>
      listRekberTransactions({
        where: { buyerId: userId },
        take: 10,
      }),
    []),
    loadDashboardPart('inspections', () =>
      prisma.inspectionOrder.findMany({
        where: { userId },
        include: { teknisi: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    []),
    loadDashboardPart('ledger', () =>
      prisma.walletLedger.findMany({
        where: { walletId: wallet.id, type: 'PAYMENT', amount: { lt: 0 } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    []),
  ])

  const totalSpent = ledgerPayments.reduce((s, l) => s + Math.abs(Number(l.amount)), 0)
  const totalOrders = marketplaceOrders.length
  const activeKonsultasi = konsultasi.filter((k) => k.status === 'PENDING' || k.status === 'ACTIVE').length
  const activeRekber = rekber.filter((r) =>
    ['PENDING', 'HELD', 'PROCESSING', 'SHIPPED', 'DISPUTED'].includes(r.status),
  ).length
  const activeInspeksi = inspections.filter((i) =>
    ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'REPORT_SUBMITTED', 'DISPUTED'].includes(i.status),
  ).length

  const spendingByMonth: Array<{ month: string; amount: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = formatMonthShortId(d)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const sum = ledgerPayments
      .filter((l) => {
        const t = l.createdAt.getTime()
        return t >= start.getTime() && t <= end.getTime()
      })
      .reduce((s, l) => s + Math.abs(Number(l.amount)), 0)
    spendingByMonth.push({ month: label, amount: sum })
  }

  type ActivityRow = UserDashboardDto['recentActivity'][0] & { sortAt: Date }

  const activity: ActivityRow[] = [
    ...marketplaceOrders.map((o) => ({
      id: o.id,
      type: 'belanja' as const,
      title: o.items[0]?.product.name ?? 'Pesanan marketplace',
      subtitle: o.seller.name ?? o.orderCode,
      amount: Number(o.total),
      status:
        o.status === 'COMPLETED'
          ? ('completed' as const)
          : o.status === 'PENDING' || o.status === 'PAID'
            ? ('pending' as const)
            : ('in-progress' as const),
      date: formatNotificationTimeLabel(o.createdAt),
      href: getUserActivityHref('belanja', o.id),
      sortAt: o.createdAt,
    })),
    ...konsultasi.map((k) => ({
      id: k.id,
      type: 'konsultasi' as const,
      title: k.service,
      subtitle: k.teknisi.name ?? 'Teknisi',
      amount: Number(k.price),
      status: mapKonsultasiStatus(k.status),
      date: formatNotificationTimeLabel(k.createdAt),
      href: getUserActivityHref('konsultasi'),
      sortAt: k.createdAt,
    })),
    ...rekber.map((r) => ({
      id: r.id,
      type: 'rekber' as const,
      title: r.description ?? 'Rekber',
      subtitle: r.seller.name ?? r.orderCode,
      amount: Number(r.amount) + Number(r.fee),
      status:
        r.status === 'RELEASED'
          ? ('completed' as const)
          : r.status === 'PENDING'
            ? ('pending' as const)
            : r.status === 'REFUNDED'
              ? ('failed' as const)
              : ('in-progress' as const),
      date: formatNotificationTimeLabel(r.createdAt),
      href: getUserActivityHref('rekber'),
      sortAt: r.createdAt,
    })),
  ]

  const recentActivity = activity
    .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
    .slice(0, 8)
    .map(({ sortAt: _s, ...rest }) => rest)

  return {
    walletBalance: balance,
    stats: {
      totalSpent,
      totalOrders,
      activeKonsultasi,
      activeRekber,
      activeInspeksi,
    },
    spendingByMonth,
    recentActivity,
  }
}
