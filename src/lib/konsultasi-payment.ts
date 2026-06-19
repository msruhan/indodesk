import { prisma } from '@/lib/db'
import { fulfillKonsultasiPaymentInTx } from '@/lib/payments/fulfill/konsultasi'

export async function secureKonsultasiPaymentByRef(
  externalRef: string,
  expectedAmount?: number,
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const session = await prisma.konsultasiSession.findUnique({
    where: { pgExternalRef: externalRef },
  })

  if (!session) return { ok: false, error: 'Sesi pembayaran tidak ditemukan' }
  if (session.status === 'PENDING' && session.paymentStatus === 'SECURED') {
    return { ok: true, sessionId: session.id }
  }
  if (session.status !== 'AWAITING_PAYMENT') {
    return { ok: false, error: 'Sesi tidak menunggu pembayaran' }
  }

  const amount = Number(session.price)
  if (expectedAmount != null && expectedAmount !== amount) {
    return { ok: false, error: 'Nominal pembayaran tidak valid' }
  }

  const result = await prisma.$transaction(async (tx) =>
    fulfillKonsultasiPaymentInTx(tx, session.id),
  )

  if (!result.ok) return result
  return { ok: true, sessionId: session.id }
}
