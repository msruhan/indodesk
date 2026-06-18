import { prisma } from '@/lib/db'
import { walletTransaction } from '@/lib/wallet/transaction'
import { logPaymentEvent } from '@/lib/activity-log'

export async function secureKonsultasiPaymentByRef(
  externalRef: string,
  expectedAmount?: number,
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const session = await prisma.konsultasiSession.findUnique({
    where: { pgExternalRef: externalRef },
  })

  if (!session) return { ok: false, error: 'Sesi pembayaran tidak ditemukan' }
  if (session.status !== 'AWAITING_PAYMENT') {
    return { ok: false, error: 'Sesi tidak menunggu pembayaran' }
  }
  if (session.paymentExpiresAt && session.paymentExpiresAt < new Date()) {
    await prisma.konsultasiSession.update({
      where: { id: session.id },
      data: { status: 'CANCELLED', paymentStatus: 'RELEASED', endedAt: new Date() },
    })
    return { ok: false, error: 'Pembayaran kedaluwarsa' }
  }

  const amount = Number(session.price)
  if (expectedAmount != null && expectedAmount !== amount) {
    return { ok: false, error: 'Nominal pembayaran tidak valid' }
  }

  await walletTransaction(async (tx) => {
    await tx.konsultasiSession.update({
      where: { id: session.id },
      data: {
        status: 'PENDING',
        paymentStatus: 'SECURED',
        paidAt: new Date(),
      },
    })
  })

  void logPaymentEvent({
    action: 'konsultasi.payment',
    severity: 'SUCCESS',
    summary: `Pembayaran PG konsultasi: ${session.service}`,
    target: { type: 'konsultasi', id: session.id, label: session.service },
  })

  return { ok: true, sessionId: session.id }
}
