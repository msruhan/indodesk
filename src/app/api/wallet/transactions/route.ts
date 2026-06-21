import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { periodDateRange, type DashboardPeriod } from '@/lib/dashboard-period'
import { buildPaginationMeta, parsePaginationParams } from '@/lib/pagination'
import { repairUnsettledMarketplaceOrdersForSeller } from '@/lib/marketplace-wallet'
import {
  labelForImeiStatus,
  labelForInspeksiStatus,
  labelForKonsultasiStatus,
  labelForLedgerType,
  labelForServerStatus,
  labelForShopStatus,
  labelForTopupStatus,
  labelForWithdrawStatus,
  type TransactionFilter,
  type UnifiedTransaction,
  balancesFromLedgerAmounts,
  computeTotalSpending,
  isSpendingTransaction,
} from '@/lib/wallet-transactions'

export const dynamic = 'force-dynamic'

const VALID_FILTERS: TransactionFilter[] = [
  'all',
  'wallet',
  'shop',
  'topup',
  'imei',
  'server',
  'konsultasi',
  'inspeksi',
]

function decimalToNumber(value: { toString(): string } | number) {
  return typeof value === 'number' ? value : Number(value.toString())
}

type LedgerRow = Awaited<ReturnType<typeof prisma.walletLedger.findMany>>[number]

function ledgerBalances(row: LedgerRow | null | undefined) {
  if (!row) return { balanceBefore: null, balanceAfter: null }
  const amount = decimalToNumber(row.amount)
  const { balanceBefore, balanceAfter } = balancesFromLedgerAmounts(
    amount,
    decimalToNumber(row.balance),
  )
  return { balanceBefore, balanceAfter }
}

function pickLedgerForOrder(refId: string, ledgersByRef: Map<string, LedgerRow[]>) {
  const rows = ledgersByRef.get(refId)
  if (!rows?.length) return null
  const sorted = [...rows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )
  return (
    sorted.find((r) => r.type === 'PAYMENT') ??
    sorted.find((r) => r.type === 'EARNING') ??
    sorted.find((r) => r.type === 'REFUND') ??
    sorted[0]
  )
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

    const [
      imeiOrders,
      serverOrders,
      topupOrders,
      shopOrders,
      sellerShopOrders,
      konsultasiAsUser,
      konsultasiAsTeknisi,
      inspeksiAsUser,
      inspeksiAsTeknisi,
      ledgerRows,
    ] = await Promise.all([
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
        prisma.konsultasiSession.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: { teknisi: { select: { name: true } } },
        }),
        prisma.konsultasiSession.findMany({
          where: {
            teknisiId: userId,
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: { user: { select: { name: true } } },
        }),
        prisma.inspectionOrder.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: { teknisi: { select: { name: true } } },
        }),
        prisma.inspectionOrder.findMany({
          where: {
            teknisiId: userId,
            status: { in: ['COMPLETED', 'REPORT_SUBMITTED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
          include: { user: { select: { name: true } } },
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
      ...konsultasiAsUser.map((o) => o.id),
      ...inspeksiAsUser.map((o) => o.id),
    ])

    const marketplaceEarningRefIds = new Set(
      ledgerRows
        .filter((r) => r.type === 'EARNING' && r.referenceId)
        .map((r) => r.referenceId as string),
    )

    const ledgersByRef = new Map<string, LedgerRow[]>()
    for (const row of ledgerRows) {
      if (!row.referenceId) continue
      const list = ledgersByRef.get(row.referenceId) ?? []
      list.push(row)
      ledgersByRef.set(row.referenceId, list)
    }

    const withdrawRefIds = [
      ...new Set(
        ledgerRows
          .map((r) => r.referenceId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]
    const withdrawRows =
      withdrawRefIds.length > 0
        ? await prisma.walletWithdrawRequest.findMany({
            where: { id: { in: withdrawRefIds }, userId },
            select: { id: true, status: true, amount: true, rejectionNote: true },
          })
        : []
    const withdrawById = new Map(withdrawRows.map((w) => [w.id, w]))

    const items: UnifiedTransaction[] = []

    for (const o of imeiOrders) {
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `imei-${o.id}`,
        category: 'imei',
        orderCode: o.orderCode,
        title: o.service.title,
        subtitle: o.imei ? `Digital: ${o.imei}` : null,
        amount: -decimalToNumber(o.price),
        ...balances,
        status: o.status,
        statusLabel: labelForImeiStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/user/orders/imei',
      })
    }

    for (const o of serverOrders) {
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `server-${o.id}`,
        category: 'server',
        orderCode: o.orderCode,
        title: o.service.title,
        subtitle: o.service.box?.title ?? null,
        amount: -decimalToNumber(o.price),
        ...balances,
        status: o.status,
        statusLabel: labelForServerStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/user/orders/imei?tab=server',
      })
    }

    for (const o of topupOrders) {
      const productLabel = o.productSlug.replace(/-/g, ' ')
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `topup-${o.id}`,
        category: 'topup',
        orderCode: o.orderCode,
        title: productLabel,
        subtitle: o.accountId ? `ID: ${o.accountId}` : null,
        amount: -decimalToNumber(o.total),
        ...balances,
        status: o.status,
        statusLabel: labelForTopupStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: o.orderCode ? `/topup/order/${o.orderCode}` : '/topup/cek-transaksi',
      })
    }

    for (const o of shopOrders) {
      const productName = o.items[0]?.product?.name ?? 'Produk marketplace'
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `shop-buy-${o.id}`,
        category: 'shop',
        orderCode: o.orderCode,
        title: productName,
        subtitle: o.seller?.name ? `Toko: ${o.seller.name}` : null,
        amount: -decimalToNumber(o.total),
        ...balances,
        status: o.status,
        statusLabel: labelForShopStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/marketplace',
      })
    }

    for (const o of sellerShopOrders) {
      if (marketplaceEarningRefIds.has(o.id)) continue
      const productName = o.items[0]?.product?.name ?? 'Produk marketplace'
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `shop-sell-${o.id}`,
        category: 'shop',
        orderCode: o.orderCode,
        title: `Penjualan: ${productName}`,
        subtitle: o.buyer?.name ? `Pembeli: ${o.buyer.name}` : null,
        amount: decimalToNumber(o.total),
        ...balances,
        status: o.status,
        statusLabel: labelForShopStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/teknisi/pesanan',
      })
    }

    for (const o of konsultasiAsUser) {
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `konsultasi-buy-${o.id}`,
        category: 'konsultasi',
        orderCode: `KON-${o.id.slice(-8).toUpperCase()}`,
        title: o.service,
        subtitle: o.teknisi?.name ? `Teknisi: ${o.teknisi.name}` : null,
        amount: -decimalToNumber(o.price),
        ...balances,
        status: o.status,
        statusLabel: labelForKonsultasiStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/user/konsultasi',
      })
    }

    for (const o of konsultasiAsTeknisi) {
      if (marketplaceEarningRefIds.has(o.id)) continue
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `konsultasi-sell-${o.id}`,
        category: 'konsultasi',
        orderCode: `KON-${o.id.slice(-8).toUpperCase()}`,
        title: `Konsultasi: ${o.service}`,
        subtitle: o.user?.name ? `Klien: ${o.user.name}` : null,
        amount: decimalToNumber(o.price),
        ...balances,
        status: o.status,
        statusLabel: labelForKonsultasiStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/teknisi/konsultasi',
      })
    }

    for (const o of inspeksiAsUser) {
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `inspeksi-buy-${o.id}`,
        category: 'inspeksi',
        orderCode: o.orderCode,
        title: o.productName,
        subtitle: o.teknisi?.name ? `Teknisi: ${o.teknisi.name}` : null,
        amount: -decimalToNumber(o.price),
        ...balances,
        status: o.status,
        statusLabel: labelForInspeksiStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: `/user/inspeksi/${o.id}`,
      })
    }

    for (const o of inspeksiAsTeknisi) {
      if (marketplaceEarningRefIds.has(o.id)) continue
      const balances = ledgerBalances(pickLedgerForOrder(o.id, ledgersByRef))
      items.push({
        id: `inspeksi-sell-${o.id}`,
        category: 'inspeksi',
        orderCode: o.orderCode,
        title: `Inspeksi: ${o.productName}`,
        subtitle: o.user?.name ? `Klien: ${o.user.name}` : null,
        amount: decimalToNumber(o.teknisiEarning),
        ...balances,
        status: o.status,
        statusLabel: labelForInspeksiStatus(o.status),
        createdAt: o.createdAt.toISOString(),
        href: '/teknisi/inspeksi',
      })
    }

    for (const row of ledgerRows) {
      if (row.type === 'PAYMENT' && row.referenceId && orderRefIds.has(row.referenceId)) {
        continue
      }
      const withdraw = row.referenceId ? withdrawById.get(row.referenceId) : undefined
      let amount = decimalToNumber(row.amount)
      let title = row.description || labelForLedgerType(row.type)
      let subtitle: string | null = labelForLedgerType(row.type)
      let status: string = row.type
      let statusLabel = labelForLedgerType(row.type)
      let rejectionNote: string | null = null

      if (withdraw) {
        status = withdraw.status
        statusLabel = labelForWithdrawStatus(withdraw.status)
        rejectionNote = withdraw.rejectionNote?.trim() || null
        if (row.type === 'WITHDRAWAL') {
          title = 'Penarikan disetujui'
          amount = -decimalToNumber(withdraw.amount)
        } else if (row.type === 'REFUND') {
          title = 'Pengembalian penarikan ditolak'
          subtitle = labelForLedgerType(row.type)
        } else if (row.type === 'ESCROW_HOLD') {
          subtitle =
            withdraw.status === 'REJECT_PENDING_RELEASE'
              ? 'Menunggu pengembalian saldo'
              : withdraw.status === 'PENDING'
                ? 'Menunggu persetujuan admin'
                : labelForLedgerType(row.type)
        }
      }

      items.push({
        id: `ledger-${row.id}`,
        category: 'wallet',
        orderCode: row.referenceId?.slice(0, 12) ?? row.id.slice(0, 8),
        title,
        subtitle,
        amount,
        ...ledgerBalances(row),
        status,
        statusLabel,
        rejectionNote,
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
      konsultasi: periodScoped.filter((t) => t.category === 'konsultasi').length,
      inspeksi: periodScoped.filter((t) => t.category === 'inspeksi').length,
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
