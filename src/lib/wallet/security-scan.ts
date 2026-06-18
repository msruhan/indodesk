import { Prisma } from '@prisma/client'
import type { LedgerType } from '@prisma/client'
import { prisma } from '@/lib/db'

const CREDIT_TYPES: LedgerType[] = ['TOPUP', 'EARNING', 'REFUND', 'ESCROW_RELEASE', 'CASHBACK']

export type WithdrawRiskInput = {
  userId: string
  walletId: string
  amount: number
}

export type WithdrawRiskResult = {
  riskScore: number
  riskFlags: string[]
}

async function referenceExists(type: LedgerType, referenceId: string): Promise<boolean> {
  switch (type) {
    case 'TOPUP': {
      const topup = await prisma.topupOrder.findUnique({ where: { id: referenceId } })
      if (topup) return true
      const dep = await prisma.walletDepositRequest.findUnique({ where: { id: referenceId } })
      return dep != null
    }
    case 'EARNING': {
      const order = await prisma.order.findUnique({ where: { id: referenceId } })
      if (order?.status === 'COMPLETED') return true
      const konsultasi = await prisma.konsultasiSession.findUnique({ where: { id: referenceId } })
      if (konsultasi?.status === 'COMPLETED') return true
      const inspection = await prisma.inspectionOrder.findUnique({ where: { id: referenceId } })
      return inspection?.status === 'COMPLETED'
    }
    case 'REFUND': {
      const konsultasi = await prisma.konsultasiSession.findUnique({ where: { id: referenceId } })
      if (konsultasi) return true
      const rekber = await prisma.rekberTransaction.findUnique({ where: { id: referenceId } })
      if (rekber) return true
      const withdraw = await prisma.walletWithdrawRequest.findUnique({ where: { id: referenceId } })
      return withdraw != null
    }
    case 'ESCROW_RELEASE': {
      const rekber = await prisma.rekberTransaction.findUnique({ where: { id: referenceId } })
      return rekber != null
    }
    case 'CASHBACK':
      return referenceId.length > 0
    default:
      return true
  }
}

export async function findOrphanCredits(walletId: string, since?: Date) {
  const rows = await prisma.walletLedger.findMany({
    where: {
      walletId,
      type: { in: CREDIT_TYPES },
      amount: { gt: 0 },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const orphans: typeof rows = []
  for (const row of rows) {
    if (!row.referenceId) {
      orphans.push(row)
      continue
    }
    const ok = await referenceExists(row.type, row.referenceId)
    if (!ok) orphans.push(row)
  }
  return orphans
}

export async function assessWithdrawRisk(input: WithdrawRiskInput): Promise<WithdrawRiskResult> {
  const flags: string[] = []
  let riskScore = 0

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const orphans = await findOrphanCredits(input.walletId, since7d)
  if (orphans.length > 0) {
    flags.push('ORPHAN_CREDIT')
    riskScore += 40
  }

  const wallet = await prisma.wallet.findUnique({
    where: { id: input.walletId },
    select: { balance: true, user: { select: { createdAt: true } } },
  })
  if (wallet) {
    const balance = Number(wallet.balance)
    if (balance > 0 && input.amount / balance > 0.8) {
      flags.push('HIGH_WITHDRAW_RATIO')
      riskScore += 15
    }
    const accountAgeDays =
      (Date.now() - wallet.user.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    if (accountAgeDays < 7 && input.amount >= 500_000) {
      flags.push('FRESH_ACCOUNT_WITHDRAW')
      riskScore += 10
    }
  }

  const openCritical = await prisma.walletSecurityAlert.count({
    where: {
      userId: input.userId,
      status: 'OPEN',
      severity: { in: ['HIGH', 'CRITICAL'] },
    },
  })
  if (openCritical > 0) {
    flags.push('OPEN_SECURITY_ALERT')
    riskScore += 25
  }

  if (orphans.length > 0) {
    const recentOrphan = orphans.some(
      (o) => Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000,
    )
    if (recentOrphan) {
      flags.push('WITHDRAW_AFTER_ANOMALY')
      riskScore += 20
    }
  }

  return { riskScore: Math.min(100, riskScore), riskFlags: flags }
}

export async function createSecurityAlert(input: {
  userId?: string
  walletId?: string
  ruleCode: string
  severity: 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  body: string
  metadata?: Record<string, unknown>
  ledgerId?: string
  withdrawRequestId?: string
}) {
  const existing = await prisma.walletSecurityAlert.findFirst({
    where: {
      userId: input.userId ?? null,
      ruleCode: input.ruleCode,
      status: 'OPEN',
      ...(input.withdrawRequestId ? { withdrawRequestId: input.withdrawRequestId } : {}),
    },
  })
  if (existing) return existing

  const alert = await prisma.walletSecurityAlert.create({
    data: {
      userId: input.userId ?? null,
      walletId: input.walletId ?? null,
      ruleCode: input.ruleCode,
      severity: input.severity,
      title: input.title,
      body: input.body,
      metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      ledgerId: input.ledgerId ?? null,
      withdrawRequestId: input.withdrawRequestId ?? null,
    },
  })

  const { notifyAdminsSecurityEvent } = await import('@/lib/security-notifications')
  void notifyAdminsSecurityEvent({
    title: input.title,
    body: input.body,
    severity: input.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
  })

  return alert
}

export async function runWalletSecurityScan(): Promise<{ orphanCount: number; alertsCreated: number }> {
  const wallets = await prisma.wallet.findMany({ select: { id: true, userId: true } })
  let orphanCount = 0
  let alertsCreated = 0

  for (const w of wallets) {
    const orphans = await findOrphanCredits(w.id)
    orphanCount += orphans.length
    if (orphans.length > 0) {
      const created = await createSecurityAlert({
        userId: w.userId,
        walletId: w.id,
        ruleCode: 'ORPHAN_CREDIT',
        severity: 'HIGH',
        title: 'Kredit wallet tanpa referensi valid',
        body: `${orphans.length} entri ledger kredit tidak memiliki referensi order/deposit yang valid.`,
        metadata: { ledgerIds: orphans.map((o) => o.id).slice(0, 10) },
        ledgerId: orphans[0]?.id,
      })
      if (created) alertsCreated++
    }
  }

  return { orphanCount, alertsCreated }
}
