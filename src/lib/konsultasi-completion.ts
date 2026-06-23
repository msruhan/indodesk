import { prisma } from '@/lib/db'
import {
  completeKonsultasiSession,
  finalizeKonsultasiCompletionSideEffects,
} from '@/lib/konsultasi-complete'
import { walletTransaction } from '@/lib/wallet/transaction'

export const KONSULTASI_CONFIRM_TIMEOUT_HOURS = 24

export function computeConfirmDeadline(from: Date): Date {
  return new Date(from.getTime() + KONSULTASI_CONFIRM_TIMEOUT_HOURS * 60 * 60 * 1000)
}

export async function processKonsultasiConfirmDeadlines(batchSize = 50) {
  const now = new Date()
  const rows = await prisma.konsultasiSession.findMany({
    where: {
      status: 'AWAITING_CONFIRMATION',
      confirmDeadlineAt: { lte: now },
    },
    take: batchSize,
    include: { user: { select: { name: true } } },
  })

  let processed = 0
  let errors = 0

  for (const row of rows) {
    try {
      const updated = await walletTransaction(async (tx) =>
        completeKonsultasiSession(tx, row, { source: 'auto_timeout' }),
      )
      await finalizeKonsultasiCompletionSideEffects(updated, {
        source: 'auto_timeout',
        userName: row.user.name,
      })
      processed += 1
    } catch (e) {
      console.error('[KONSULTASI_AUTO_COMPLETE]', row.id, e)
      errors += 1
    }
  }

  return { processed, errors, scanned: rows.length }
}
