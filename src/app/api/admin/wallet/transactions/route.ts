/**
 * GET /api/admin/wallet/transactions
 *
 * Mengembalikan WalletLedger gabungan untuk admin (deposit + pemotongan).
 *
 * Query params:
 *   - kind: 'deposit' | 'spending' | 'all' (default 'all')
 *   - q:   string         (cari nama / email user)
 *   - userId: string?     (filter user tertentu)
 *   - from: ISO date?     (rentang waktu mulai)
 *   - to:   ISO date?     (rentang waktu akhir, exclusive)
 *   - limit: number?      (default 100, max 200)
 *
 * Selain list, kembali juga `stats` agregat 30 hari terakhir.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  classifyDeposit,
  classifySpending,
  type AdminSaldoStats,
  type DepositLedgerDto,
  type SpendingLedgerDto,
} from '@/lib/admin-saldo'

export const dynamic = 'force-dynamic'

const DEPOSIT_TYPES = ['TOPUP', 'EARNING', 'CASHBACK', 'REFUND', 'ESCROW_RELEASE'] as const
const SPENDING_TYPES = ['PAYMENT', 'WITHDRAWAL', 'ESCROW_HOLD'] as const

type RecordWithUser = Prisma.WalletLedgerGetPayload<{
  include: {
    wallet: {
      include: {
        user: { select: { id: true; name: true; email: true; role: true; image: true } }
      }
    }
  }
}>

function userDto(record: RecordWithUser['wallet']['user']) {
  return {
    id: record.id,
    name: record.name,
    email: record.email ?? '',
    role: record.role,
    image: record.image,
  }
}

async function resolveOrderInfo(
  type: Prisma.WalletLedgerGetPayload<Record<string, never>>['type'],
  description: string,
  referenceId: string | null,
): Promise<{ orderCode: string | null; orderHref: string | null }> {
  if (!referenceId) return { orderCode: null, orderHref: null }
  const lower = description.toLowerCase()

  if (type === 'PAYMENT' || type === 'REFUND') {
    if (lower.includes('imei')) {
      const order = await prisma.imeiOrder.findUnique({
        where: { id: referenceId },
        select: { orderCode: true, id: true },
      })
      if (order) {
        return {
          orderCode: order.orderCode,
          orderHref: `/admin/imei?tab=orders&id=${order.id}`,
        }
      }
    }
    if (lower.includes('server')) {
      const order = await prisma.serverOrder.findUnique({
        where: { id: referenceId },
        select: { orderCode: true, id: true },
      })
      if (order) {
        return {
          orderCode: order.orderCode,
          orderHref: `/admin/imei?tab=server-orders&id=${order.id}`,
        }
      }
    }
  }
  return { orderCode: null, orderHref: null }
}

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const kind = (url.searchParams.get('kind') ?? 'all') as 'deposit' | 'spending' | 'all'
  const q = url.searchParams.get('q')?.trim() ?? ''
  const userId = url.searchParams.get('userId')?.trim() ?? ''
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '100', 10) || 100, 1), 200)

  const typeFilter =
    kind === 'deposit'
      ? { type: { in: [...DEPOSIT_TYPES] } }
      : kind === 'spending'
        ? { type: { in: [...SPENDING_TYPES] } }
        : {}

  const userFilter: Prisma.WalletLedgerWhereInput = userId
    ? { wallet: { userId } }
    : q
      ? {
          wallet: {
            user: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        }
      : {}

  const dateFilter: Prisma.WalletLedgerWhereInput = {}
  if (from || to) {
    const range: Prisma.DateTimeFilter = {}
    if (from) range.gte = new Date(from)
    if (to) range.lt = new Date(to)
    dateFilter.createdAt = range
  }

  const where: Prisma.WalletLedgerWhereInput = {
    ...typeFilter,
    ...userFilter,
    ...dateFilter,
  }

  try {
    // Stats dihitung tanpa filter (tetap 30 hari) supaya konsisten.
    const startOf30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [items, totalSaldoAgg, depositAgg, spendingAgg, depositCount, spendingCount] = await Promise.all([
      prisma.walletLedger.findMany({
        where,
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }) as Promise<RecordWithUser[]>,
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.walletLedger.aggregate({
        _sum: { amount: true },
        where: {
          type: { in: [...DEPOSIT_TYPES] },
          createdAt: { gte: startOf30d },
        },
      }),
      prisma.walletLedger.aggregate({
        _sum: { amount: true },
        where: {
          type: { in: [...SPENDING_TYPES] },
          createdAt: { gte: startOf30d },
        },
      }),
      prisma.walletLedger.count({
        where: { type: { in: [...DEPOSIT_TYPES] }, createdAt: { gte: startOf30d } },
      }),
      prisma.walletLedger.count({
        where: { type: { in: [...SPENDING_TYPES] }, createdAt: { gte: startOf30d } },
      }),
    ])

    const deposits: DepositLedgerDto[] = []
    const spendings: SpendingLedgerDto[] = []

    for (const r of items) {
      const isDeposit = (DEPOSIT_TYPES as readonly string[]).includes(r.type)
      const isSpending = (SPENDING_TYPES as readonly string[]).includes(r.type)

      if (isDeposit) {
        const { method, performedBy } = classifyDeposit(r.type, r.description ?? '')
        deposits.push({
          id: r.id,
          walletId: r.walletId,
          user: userDto(r.wallet.user),
          ledgerType: r.type,
          amount: r.amount.toString(),
          balanceAfter: r.balance.toString(),
          description: r.description ?? '',
          referenceId: r.referenceId,
          method,
          performedBy,
          createdAt: r.createdAt.toISOString(),
        })
      } else if (isSpending) {
        const category = classifySpending(r.type, r.description ?? '')
        const { orderCode, orderHref } = await resolveOrderInfo(
          r.type,
          r.description ?? '',
          r.referenceId,
        )
        spendings.push({
          id: r.id,
          walletId: r.walletId,
          user: userDto(r.wallet.user),
          ledgerType: r.type,
          amount: r.amount.toString(),
          balanceAfter: r.balance.toString(),
          description: r.description ?? '',
          referenceId: r.referenceId,
          category,
          orderCode,
          orderHref,
          createdAt: r.createdAt.toISOString(),
        })
      }
    }

    const stats: AdminSaldoStats = {
      totalSaldo: (totalSaldoAgg._sum.balance ?? new Prisma.Decimal(0)).toString(),
      totalDeposit30d: (depositAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
      totalSpending30d: (spendingAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
      totalDepositCount30d: depositCount,
      totalSpendingCount30d: spendingCount,
    }

    return apiSuccess({ deposits, spendings, stats })
  } catch (e) {
    console.error('[ADMIN_WALLET_TRANSACTIONS_GET]', e)
    return apiError('Gagal memuat transaksi wallet', 500)
  }
}
