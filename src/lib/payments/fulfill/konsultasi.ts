import type { Prisma as PrismaNamespace } from '@prisma/client'
import { logPaymentEvent, logCommunicationEvent } from '@/lib/activity-log'
import { notifyKonsultasiNew } from '@/lib/telegram/notify'

export async function fulfillKonsultasiPaymentInTx(
  tx: PrismaNamespace.TransactionClient,
  sessionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await tx.konsultasiSession.findUnique({
    where: { id: sessionId },
    include: { teknisi: { select: { name: true } }, user: { select: { name: true, email: true } } },
  })

  if (!session) return { ok: false, error: 'Sesi konsultasi tidak ditemukan' }
  if (session.status === 'PENDING' && session.paymentStatus === 'SECURED') {
    return { ok: true }
  }
  if (session.status !== 'AWAITING_PAYMENT') {
    return { ok: false, error: 'Sesi tidak menunggu pembayaran' }
  }
  if (session.paymentExpiresAt && session.paymentExpiresAt < new Date()) {
    await tx.konsultasiSession.update({
      where: { id: session.id },
      data: { status: 'CANCELLED', paymentStatus: 'RELEASED', endedAt: new Date() },
    })
    return { ok: false, error: 'Pembayaran kedaluwarsa' }
  }

  await tx.konsultasiSession.update({
    where: { id: session.id },
    data: {
      status: 'PENDING',
      paymentStatus: 'SECURED',
      paidAt: new Date(),
    },
  })

  void logPaymentEvent({
    action: 'konsultasi.payment',
    severity: 'SUCCESS',
    summary: `Pembayaran Tripay konsultasi: ${session.service}`,
    target: { type: 'konsultasi', id: session.id, label: session.service },
  })

  void logCommunicationEvent({
    action: 'konsultasi.created',
    severity: 'INFO',
    summary: `Konsultasi dibayar: ${session.service} — ${session.teknisi.name ?? 'Teknisi'}`,
    actor: {
      id: session.userId,
      name: session.user.name,
      email: session.user.email,
      role: 'USER',
    },
    target: { type: 'konsultasi', id: session.id, label: session.service },
  })

  void notifyKonsultasiNew(session.id)

  return { ok: true }
}

export async function cancelKonsultasiAwaitingPaymentInTx(
  tx: PrismaNamespace.TransactionClient,
  sessionId: string,
) {
  const session = await tx.konsultasiSession.findUnique({ where: { id: sessionId } })
  if (!session || session.status !== 'AWAITING_PAYMENT') return

  await tx.konsultasiSession.update({
    where: { id: sessionId },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'RELEASED',
      endedAt: new Date(),
    },
  })
}
