import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logSystemEvent } from '@/lib/activity-log'
import { buildWalletReconciliationDriftChronology } from '@/lib/activity-log-narrative'

export type ReconciliationDrift = {
  walletId: string
  userId: string
  ledgerSum: string
  balance: string
  drift: string
}

export type ReconciliationResult = {
  checked: number
  drifts: ReconciliationDrift[]
}

/**
 * Compare Wallet.balance vs SUM(WalletLedger.amount) per wallet.
 */
export async function runWalletReconciliation(): Promise<ReconciliationResult> {
  const wallets = await prisma.wallet.findMany({
    select: { id: true, userId: true, balance: true },
  })

  const drifts: ReconciliationDrift[] = []

  for (const w of wallets) {
    const agg = await prisma.walletLedger.aggregate({
      where: { walletId: w.id },
      _sum: { amount: true },
    })
    const ledgerSum = agg._sum.amount ?? new Prisma.Decimal(0)
    const drift = w.balance.sub(ledgerSum)
    if (!drift.isZero()) {
      drifts.push({
        walletId: w.id,
        userId: w.userId,
        ledgerSum: ledgerSum.toString(),
        balance: w.balance.toString(),
        drift: drift.toString(),
      })
    }
  }

  if (drifts.length > 0) {
    await prisma.platformNotification.create({
      data: {
        title: 'Wallet reconciliation drift detected',
        body: `${drifts.length} wallet(s) have balance ≠ ledger sum. Periksa log sistem.`,
        audiences: ['ADMIN'],
        tone: 'danger',
        icon: 'warning',
        active: true,
      },
    })

    const chronology = buildWalletReconciliationDriftChronology(drifts.length, drifts)
    void logSystemEvent({
      action: 'wallet.reconciliation.drift',
      severity: 'CRITICAL',
      summary: `Wallet drift: ${drifts.length} wallet(s)`,
      detail: drifts
        .slice(0, 10)
        .map((d) => `user=${d.userId} drift=${d.drift}`)
        .join('\n'),
      metadata: { count: drifts.length, drifts: drifts.slice(0, 20), chronology },
    })
  }

  return { checked: wallets.length, drifts }
}
