import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { periodDateRange, type DashboardPeriod } from '@/lib/dashboard-period'
import { buildPaginationMeta, parsePaginationParams } from '@/lib/pagination'
import { repairUnsettledMarketplaceOrdersForSeller } from '@/lib/marketplace-wallet'
import {
  labelForImeiStatus,
  labelForLedgerType,
  labelForServerStatus,
  labelForShopStatus,
  labelForTopupStatus,
  type TransactionFilter,
  type UnifiedTransaction,
  computeTotalSpending,
  isSpendingTransaction,
} from '@/lib/wallet-transactions'

export const dynamic = 'force-dynamic'

const VALID_FILTERS: TransactionFilter[] = ['all', 'wallet', 'shop', 'topup', 'imei', 'server']

function decimalToNumber(value: { toString(): string } | number) {
  return typeof value === 'number' ? value : Number(value.toString())
}

function parsePeriodFromQuery(searchParams: URLSearchParams): DashboardPeriod | null {
  const yearRaw = searchParams.get('year')
  const monthRaw = searchParams.get('month')
  if (!yearRaw || !monthRaw) return null
  const year = parseInt(yearRaw, 10)
  const month1 = parseInt(monthRaw, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month1) || month1 < 1 || month1 > 12) {
    return null
  }
  return { year, month: month1 - 1 }
}

/** GET /api/wallet/transactions — unified order & wallet activity */
export async function GET(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const filterParam = (searchParams.get('category') || 'all') as TransactionFilter
    const filter: TransactionFilter = VALID_FILTERS.includes(filterParam) ? filterParam : 'all'
    const { page, pageSize, skip } = parsePaginationParams(searchParams)

    const userId = session.user.id

    await repairUnsettledMarketplaceOrdersForSeller(userId)

    const wallet = await prisma.wallet.findUnique({ where: { userId } })

    const [imeiOrders, serverOrders, topupOrders, shopOrders, sellerShopOrders, ledgerRows] =
      await Promise.all([
        prisma.imeiOrder.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: { service: { select: { title: true } } },
        }),
        prisma.serverOrder.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: {
            service: { select: { title: true, box: { select: { title: true } } } },
          },
        }),
        prisma.topupOrder.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 80,
        }),
        prisma.order.findMany({
          where: { buyerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: {
            items: {
              take: 1,
              include: { product: { select: { name: true } } },
            },
            seller: { select: { name: true } },
          },
        }),
        prisma.order.findMany({
          where: {
            sellerId: userId,
            status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: {
            items: {
              take: 1,
              include: { product: { select: { name: true } } },
            },
            buyer: { select: { name: true } },
          },
        }),
        wallet
          ? prisma.walletLedger.findMany({
              where: { walletId: wallet.id },
              orderBy: { createdAt: 'desc' },
              take: 80,
            })
          : Promise.resolve([]),
      ])

    const orderRefIds = new Set([
      ...imeiOrders.map((o) => o.id),
      ...serverOrders.map((o) => o.id),
    ])

    const marketplaceEarningRefIds = new Set(
      ledgerRows
        .filter((r) => r.type === 'EARNING' && r.referenceId)
        .map((r) => r.referenceId as string),
    )

    const items: UnifiedTransaction[] = []

    for (const o of imeiOrders) {
      items.push({
        id: `imei-${o.id}`,
        category: 'imei',
        orderCode: o.orderCode,
        title: o.service.title,
        subtitle: o.imei ? `IMEI: ${o.imei}` : null,
        amount: -decimalToNumber(o.price),
        status: o.status,
        statusLabel: labelForImeiStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/user/orders/imei',
      })
    }

    for (const o of serverOrders) {
      items.push({
        id: `server-${o.id}`,
        category: 'server',
        orderCode: o.orderCode,
        title: o.service.title,
        subtitle: o.service.box?.title ?? null,
        amount: -decimalToNumber(o.price),
        status: o.status,
        statusLabel: labelForServerStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/user/orders/imei?tab=server',
      })
    }

    for (const o of topupOrders) {
      const productLabel = o.productSlug.replace(/-/g, ' ')
      items.push({
        id: `topup-${o.id}`,
        category: 'topup',
        orderCode: o.orderCode,
        title: productLabel,
        subtitle: o.accountId ? `ID: ${o.accountId}` : null,
        amount: -decimalToNumber(o.total),
        status: o.status,
        statusLabel: labelForTopupStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: o.orderCode ? `/topup/order/${o.orderCode}` : '/topup/cek-transaksi',
      })
    }

    for (const o of shopOrders) {
      const productName = o.items[0]?.product?.name ?? 'Produk marketplace'
      items.push({
        id: `shop-buy-${o.id}`,
        category: 'shop',
        orderCode: o.orderCode,
        title: productName,
        subtitle: o.seller?.name ? `Toko: ${o.seller.name}` : null,
        amount: -decimalToNumber(o.total),
        status: o.status,
        statusLabel: labelForShopStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/marketplace',
      })
    }

    for (const o of sellerShopOrders) {
      if (marketplaceEarningRefIds.has(o.id)) continue
      const productName = o.items[0]?.product?.name ?? 'Produk marketplace'
      items.push({
        id: `shop-sell-${o.id}`,
        category: 'shop',
        orderCode: o.orderCode,
        title: `Penjualan: ${productName}`,
        subtitle: o.buyer?.name ? `Pembeli: ${o.buyer.name}` : null,
        amount: decimalToNumber(o.total),
        status: o.status,
        statusLabel: labelForShopStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/teknisi/pesanan',
      })
    }

    for (const row of ledgerRows) {
      if (row.type === 'PAYMENT' && row.referenceId && orderRefIds.has(row.referenceId)) {
        continue
      }
      const amount = decimalToNumber(row.amount)
      items.push({
        id: `ledger-${row.id}`,
        category: 'wallet',
        orderCode: row.referenceId?.slice(0, 12) ?? row.id.slice(0, 8),
        title: row.description || labelForLedgerType(row.type),
        subtitle: labelForLedgerType(row.type),
        amount,
        status: row.type,
        statusLabel: labelForLedgerType(row.type),
        createdAt: row.createdAt.toISOString(),
        href: null,
      })
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const period = parsePeriodFromQuery(searchParams)
    const periodScoped = period
      ? items.filter((tx) => {
          const d = new Date(tx.createdAt)
          const { start, end } = periodDateRange(period)
          return d >= start && d <= end
        })
      : items

    const filtered =
      filter === 'all'
        ? periodScoped
        : periodScoped.filter((t) => t.category === filter)

    const counts = {
      all: periodScoped.length,
      wallet: periodScoped.filter((t) => t.category === 'wallet').length,
      shop: periodScoped.filter((t) => t.category === 'shop').length,
      topup: periodScoped.filter((t) => t.category === 'topup').length,
      imei: periodScoped.filter((t) => t.category === 'imei').length,
      server: periodScoped.filter((t) => t.category === 'server').length,
    }

    const totalSpending = computeTotalSpending(periodScoped)
    const spendingCount = periodScoped.filter(isSpendingTransaction).length

    const totalFiltered = filtered.length
    const paginated = filtered.slice(skip, skip + pageSize)

    return apiSuccess({
      balance: wallet ? wallet.balance.toString() : '0',
      transactions: paginated,
      counts,
      totalSpending,
      spendingCount,
      period: period ? { year: period.year, month: period.month + 1 } : null,
      pagination: buildPaginationMeta(totalFiltered, page, pageSize),
    })
  } catch (e) {
    console.error('[WALLET_TRANSACTIONS_GET]', e)
    return apiError('Gagal mengambil riwayat transaksi', 500)
  }
}
