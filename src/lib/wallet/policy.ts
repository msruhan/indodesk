import type { LedgerType, Prisma as PrismaNamespace } from '@prisma/client'
import { prisma } from '@/lib/db'

export class WalletPolicyError extends Error {
  readonly code = 'WALLET_LIMIT_EXCEEDED'

  constructor(message: string) {
    super(message)
    this.name = 'WalletPolicyError'
  }
}

type LimitKind = 'WITHDRAW' | 'TRANSFER'
type TxClient = PrismaNamespace.TransactionClient

function envLimit(kind: LimitKind): number {
  if (kind === 'WITHDRAW') {
    return Number(process.env.WALLET_DAILY_WITHDRAW_LIMIT ?? 10_000_000)
  }
  return Number(process.env.WALLET_DAILY_TRANSFER_LIMIT ?? 50_000_000)
}

function startOfTodayUtc(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

async function resolveDailyLimit(
  userId: string,
  kind: LimitKind,
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletPolicyOverride: true },
  })
  const override = user?.walletPolicyOverride as
    | { dailyWithdrawLimit?: number; dailyTransferLimit?: number }
    | null
    | undefined

  if (kind === 'WITHDRAW' && override?.dailyWithdrawLimit != null) {
    return override.dailyWithdrawLimit
  }
  if (kind === 'TRANSFER' && override?.dailyTransferLimit != null) {
    return override.dailyTransferLimit
  }
  return envLimit(kind)
}

async function sumLedgerToday(
  walletId: string,
  types: LedgerType[],
): Promise<number> {
  const since = startOfTodayUtc()
  const agg = await prisma.walletLedger.aggregate({
    where: {
      walletId,
      type: { in: types },
      createdAt: { gte: since },
      amount: { lt: 0 },
    },
    _sum: { amount: true },
  })
  return Math.abs(Number(agg._sum.amount ?? 0))
}

async function sumLedgerTodayInTx(
  tx: TxClient,
  walletId: string,
  types: LedgerType[],
): Promise<number> {
  const since = startOfTodayUtc()
  const agg = await tx.walletLedger.aggregate({
    where: {
      walletId,
      type: { in: types },
      createdAt: { gte: since },
      amount: { lt: 0 },
    },
    _sum: { amount: true },
  })
  return Math.abs(Number(agg._sum.amount ?? 0))
}

/**
 * Assert daily limit inside an open wallet transaction (closes TOCTOU races).
 */
export async function assertDailyLimitInTx(
  tx: TxClient,
  opts: {
    userId: string
    kind: LimitKind
    amount: number | PrismaNamespace.Decimal
  },
): Promise<void> {
  const wallet = await tx.wallet.findUnique({
    where: { userId: opts.userId },
    select: { id: true },
  })
  if (!wallet) throw new WalletPolicyError('Wallet tidak ditemukan')

  const limit = await resolveDailyLimit(opts.userId, opts.kind)
  const types: LedgerType[] =
    opts.kind === 'WITHDRAW' ? ['WITHDRAWAL', 'ESCROW_HOLD'] : ['PAYMENT', 'ESCROW_HOLD']

  const used = await sumLedgerTodayInTx(tx, wallet.id, types)
  const next = used + Math.abs(Number(opts.amount))
  if (next > limit) {
    throw new WalletPolicyError(
      `Batas harian ${opts.kind === 'WITHDRAW' ? 'penarikan' : 'transfer'} terlampaui (Rp ${limit.toLocaleString('id-ID')})`,
    )
  }
}

/**
 * Assert user may debit `amount` for withdraw or outbound transfer today.
 */
export async function assertDailyLimit(opts: {
  userId: string
  kind: LimitKind
  amount: number | PrismaNamespace.Decimal
}): Promise<void> {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: opts.userId },
    select: { id: true },
  })
  if (!wallet) throw new WalletPolicyError('Wallet tidak ditemukan')

  const limit = await resolveDailyLimit(opts.userId, opts.kind)
  const types: LedgerType[] =
    opts.kind === 'WITHDRAW' ? ['WITHDRAWAL', 'ESCROW_HOLD'] : ['PAYMENT', 'ESCROW_HOLD']

  const used = await sumLedgerToday(wallet.id, types)
  const next = used + Math.abs(Number(opts.amount))
  if (next > limit) {
    throw new WalletPolicyError(
      `Batas harian ${opts.kind === 'WITHDRAW' ? 'penarikan' : 'transfer'} terlampaui (Rp ${limit.toLocaleString('id-ID')})`,
    )
  }
}
