import { prisma } from '@/lib/db'
import { logOrderEvent } from '@/lib/activity-log'
import type { ActivityActor } from '@/lib/activity-log'
import { addDays, SELLER_RESPONSE_DAYS } from '@/lib/marketplace-order-deadlines'
import { uploadRekberComplaintMediaFiles } from '@/lib/rekber-complaint-media'
import { serializeRekber, type RekberParty } from '@/lib/rekber-serializer'
import {
  REKBER_COMPLAINT_PHOTO_MIN,
  REKBER_COMPLAINT_VIDEO_MIN,
  rekberComplaintReasonSchema,
  rekberComplaintSellerResponseSchema,
} from '@/lib/validations/rekber-complaint'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof RekberParty, true>

const REKBER_INCLUDE = {
  buyer: { select: PARTY_SELECT },
  seller: { select: PARTY_SELECT },
  inspectionOrder: { select: { orderCode: true } },
  complaint: { include: { media: true } },
  packagingProof: { include: { media: true } },
} as const

export async function createRekberComplaint(
  rekberId: string,
  buyerId: string,
  reason: string,
  defectPhotos: File[],
  unboxingVideos: File[],
  actor: ActivityActor,
) {
  const parsedReason = rekberComplaintReasonSchema.safeParse(reason)
  if (!parsedReason.success) {
    throw new Error(parsedReason.error.issues[0]?.message ?? 'Alasan tidak valid')
  }
  if (defectPhotos.length < REKBER_COMPLAINT_PHOTO_MIN) {
    throw new Error('DEFECT_PHOTO_REQUIRED')
  }
  if (unboxingVideos.length < REKBER_COMPLAINT_VIDEO_MIN) {
    throw new Error('UNBOXING_VIDEO_REQUIRED')
  }

  const rekber = await prisma.rekberTransaction.findFirst({
    where: { id: rekberId, buyerId },
    include: REKBER_INCLUDE,
  })
  if (!rekber) throw new Error('REKBER_NOT_FOUND')
  if (!['HELD', 'PROCESSING', 'SHIPPED'].includes(rekber.status)) {
    throw new Error('INVALID_STATUS')
  }
  if (rekber.complaint) throw new Error('COMPLAINT_EXISTS')

  const media = await uploadRekberComplaintMediaFiles(
    rekberId,
    buyerId,
    defectPhotos,
    unboxingVideos,
  )
  const now = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    await tx.rekberComplaint.create({
      data: {
        rekberId,
        buyerId,
        sellerId: rekber.sellerId,
        reason: parsedReason.data,
        status: 'OPEN',
        sellerDeadline: addDays(now, SELLER_RESPONSE_DAYS),
        media: {
          create: media.map((m) => ({
            type: m.type,
            url: m.url,
            mimeType: m.mimeType,
            sizeBytes: m.sizeBytes,
          })),
        },
      },
    })

    return tx.rekberTransaction.update({
      where: { id: rekberId },
      data: { status: 'DISPUTED', disputedAt: now },
      include: REKBER_INCLUDE,
    })
  })

  void logOrderEvent({
    action: 'rekber.complaint_filed',
    severity: 'WARNING',
    summary: `Komplain rekber ${rekber.orderCode}`,
    actor,
    target: { type: 'rekber', id: rekberId, label: rekber.orderCode },
  })

  return serializeRekber(updated, { viewerId: buyerId, viewerRole: 'USER' })
}

export async function respondToRekberComplaint(
  rekberId: string,
  sellerId: string,
  response: string,
  actor: ActivityActor,
) {
  const parsed = rekberComplaintSellerResponseSchema.safeParse(response)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Respons tidak valid')
  }

  const complaint = await prisma.rekberComplaint.findFirst({
    where: { rekberId, sellerId, status: 'OPEN' },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')
  if (complaint.sellerDeadline < new Date()) throw new Error('SELLER_DEADLINE_PASSED')

  const now = new Date()
  await prisma.rekberComplaint.update({
    where: { id: complaint.id },
    data: {
      status: 'SELLER_RESPONDED',
      sellerResponse: parsed.data,
      sellerRespondedAt: now,
    },
  })

  const rekber = await prisma.rekberTransaction.findUnique({
    where: { id: rekberId },
    include: REKBER_INCLUDE,
  })
  if (!rekber) throw new Error('REKBER_NOT_FOUND')

  void logOrderEvent({
    action: 'rekber.complaint_seller_responded',
    severity: 'INFO',
    summary: `Respons komplain rekber ${rekber.orderCode}`,
    actor,
    target: { type: 'rekber', id: rekberId, label: rekber.orderCode },
  })

  return serializeRekber(rekber, { viewerId: sellerId, viewerRole: 'TEKNISI' })
}

export async function escalateRekberComplaint(
  rekberId: string,
  buyerId: string,
  actor: ActivityActor,
) {
  const complaint = await prisma.rekberComplaint.findFirst({
    where: { rekberId, buyerId, status: 'SELLER_RESPONDED' },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')

  const now = new Date()
  await prisma.rekberComplaint.update({
    where: { id: complaint.id },
    data: { status: 'ESCALATED', escalatedAt: now },
  })

  const rekber = await prisma.rekberTransaction.findUnique({
    where: { id: rekberId },
    include: REKBER_INCLUDE,
  })
  if (!rekber) throw new Error('REKBER_NOT_FOUND')

  void logOrderEvent({
    action: 'rekber.complaint_escalated',
    severity: 'WARNING',
    summary: `Eskalasi komplain rekber ${rekber.orderCode}`,
    actor,
    target: { type: 'rekber', id: rekberId, label: rekber.orderCode },
  })

  return serializeRekber(rekber, { viewerId: buyerId, viewerRole: 'USER' })
}

export async function withdrawRekberComplaint(
  rekberId: string,
  buyerId: string,
  actor: ActivityActor,
) {
  const complaint = await prisma.rekberComplaint.findFirst({
    where: { rekberId, buyerId, status: { in: ['OPEN', 'SELLER_RESPONDED'] } },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')

  const existing = await prisma.rekberTransaction.findUnique({
    where: { id: rekberId },
    select: { shippedAt: true, processedAt: true, orderCode: true },
  })
  if (!existing) throw new Error('REKBER_NOT_FOUND')

  const restoreStatus = existing.shippedAt
    ? ('SHIPPED' as const)
    : existing.processedAt
      ? ('PROCESSING' as const)
      : ('HELD' as const)

  await prisma.$transaction(async (tx) => {
    await tx.rekberComplaint.update({
      where: { id: complaint.id },
      data: { status: 'WITHDRAWN' },
    })
    await tx.rekberTransaction.update({
      where: { id: rekberId },
      data: { status: restoreStatus, disputedAt: null },
    })
  })

  const rekber = await prisma.rekberTransaction.findUnique({
    where: { id: rekberId },
    include: REKBER_INCLUDE,
  })
  if (!rekber) throw new Error('REKBER_NOT_FOUND')

  void logOrderEvent({
    action: 'rekber.complaint_withdrawn',
    severity: 'INFO',
    summary: `Komplain rekber ${rekber.orderCode} ditarik`,
    actor,
    target: { type: 'rekber', id: rekberId, label: rekber.orderCode },
  })

  return serializeRekber(rekber, { viewerId: buyerId, viewerRole: 'USER' })
}
