import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAdminEvent, logPaymentEvent } from '@/lib/activity-log'
import type { ActivityActor } from '@/lib/activity-log'
import {
  partialRekberSettlement,
  refundRekberToBuyer,
  releaseRekberToSeller,
} from '@/lib/rekber-wallet'
import { serializeRekber, type RekberParty } from '@/lib/rekber-serializer'
import { rekberComplaintResolveSchema } from '@/lib/validations/rekber-complaint'
import { walletTransaction } from '@/lib/wallet/transaction'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
} satisfies Record<keyof RekberParty, true>

const REKBER_INCLUDE = {
  buyer: { select: PARTY_SELECT },
  seller: { select: PARTY_SELECT },
  inspectionOrder: { select: { orderCode: true } },
  complaint: { include: { media: true } },
} as const

export async function resolveRekberComplaint(
  complaintId: string,
  adminId: string,
  input: unknown,
  actor: ActivityActor,
) {
  const parsed = rekberComplaintResolveSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const complaint = await prisma.rekberComplaint.findUnique({
    where: { id: complaintId },
    include: { rekber: true },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')
  if (complaint.status !== 'ESCALATED') throw new Error('INVALID_COMPLAINT_STATUS')

  const rekber = complaint.rekber
  const amount = Number(rekber.amount)
  const fee = Number(rekber.fee)
  const totalHold = amount + fee

  if (parsed.data.resolution === 'REFUND_PARTIAL') {
    const refund = parsed.data.refundAmount
    if (refund == null || refund <= 0 || refund >= amount) {
      throw new Error('REFUND_AMOUNT_INVALID')
    }
  }

  const refundAmount =
    parsed.data.resolution === 'REFUND_FULL'
      ? totalHold
      : parsed.data.resolution === 'REFUND_PARTIAL'
        ? (parsed.data.refundAmount ?? 0)
        : 0

  const now = new Date()

  const updated = await walletTransaction(async (tx) => {
    if (parsed.data.resolution === 'REFUND_FULL') {
      await refundRekberToBuyer(
        tx,
        rekber.buyerId,
        new Prisma.Decimal(totalHold),
        rekber.id,
        rekber.orderCode,
      )
      await tx.rekberTransaction.update({
        where: { id: rekber.id },
        data: { status: 'REFUNDED', refundedAt: now },
      })
    } else if (parsed.data.resolution === 'REFUND_PARTIAL' && refundAmount > 0) {
      const sellerRelease = Math.max(0, amount - refundAmount)
      await partialRekberSettlement(
        tx,
        rekber.buyerId,
        rekber.sellerId,
        new Prisma.Decimal(refundAmount),
        new Prisma.Decimal(sellerRelease),
        rekber.id,
        rekber.orderCode,
      )
      await tx.rekberTransaction.update({
        where: { id: rekber.id },
        data: { status: 'RELEASED', releasedAt: now },
      })
    } else if (parsed.data.resolution === 'REJECTED') {
      await releaseRekberToSeller(
        tx,
        rekber.sellerId,
        rekber.amount,
        rekber.id,
        rekber.orderCode,
      )
      await tx.rekberTransaction.update({
        where: { id: rekber.id },
        data: { status: 'RELEASED', releasedAt: now },
      })
    }

    await tx.rekberComplaint.update({
      where: { id: complaintId },
      data: {
        status: 'RESOLVED',
        resolution: parsed.data.resolution,
        refundAmount: refundAmount > 0 ? refundAmount : null,
        adminNote: parsed.data.adminNote?.trim() || null,
        adminId,
        resolvedAt: now,
      },
    })

    return tx.rekberTransaction.findUnique({
      where: { id: rekber.id },
      include: REKBER_INCLUDE,
    })
  })

  if (!updated) throw new Error('REKBER_NOT_FOUND')

  void logPaymentEvent({
    action: 'rekber.complaint_resolved',
    severity: 'INFO',
    summary: `Komplain rekber ${rekber.orderCode} → ${parsed.data.resolution}`,
    actor,
    target: { type: 'rekber', id: rekber.id, label: rekber.orderCode },
  })
  void logAdminEvent({
    action: 'rekber.complaint.resolve',
    severity: 'INFO',
    summary: `Resolve komplain rekber ${rekber.orderCode} → ${parsed.data.resolution}`,
    actor,
    target: { type: 'rekber', id: rekber.id, label: rekber.orderCode },
  })

  return serializeRekber(updated, { viewerId: adminId, viewerRole: 'ADMIN' })
}
