import { prisma } from '@/lib/db'
import { logOrderEvent, type ActivityActor } from '@/lib/activity-log'
import { addDays } from '@/lib/marketplace-order-deadlines'
import { uploadRekberPackagingMediaFiles } from '@/lib/rekber-packaging-media'
import {
  MARKETPLACE_PACKAGING_PHOTO_MAX_COUNT,
  MARKETPLACE_PACKAGING_PHOTO_MIN,
  MARKETPLACE_PACKAGING_VIDEO_MAX_COUNT,
  MARKETPLACE_PACKAGING_VIDEO_MIN,
  PACKAGING_RESUBMIT_DAYS,
} from '@/lib/validations/marketplace-packaging'

export async function submitRekberPackagingProof(
  rekberId: string,
  sellerId: string,
  photos: File[],
  videos: File[],
  actor: ActivityActor,
) {
  if (photos.length < MARKETPLACE_PACKAGING_PHOTO_MIN) {
    throw new Error('PACKAGING_PHOTO_REQUIRED')
  }
  if (videos.length < MARKETPLACE_PACKAGING_VIDEO_MIN) {
    throw new Error('PACKAGING_VIDEO_REQUIRED')
  }
  if (photos.length > MARKETPLACE_PACKAGING_PHOTO_MAX_COUNT) {
    throw new Error('PACKAGING_PHOTO_TOO_MANY')
  }
  if (videos.length > MARKETPLACE_PACKAGING_VIDEO_MAX_COUNT) {
    throw new Error('PACKAGING_VIDEO_TOO_MANY')
  }

  const rekber = await prisma.rekberTransaction.findFirst({
    where: { id: rekberId, sellerId },
    include: { packagingProof: true },
  })
  if (!rekber) throw new Error('REKBER_NOT_FOUND')
  if (rekber.status !== 'HELD') throw new Error('INVALID_STATUS')

  const existing = rekber.packagingProof
  if (existing?.status === 'PENDING') {
    throw new Error('PACKAGING_PENDING_REVIEW')
  }
  if (
    existing?.status === 'REJECTED' &&
    existing.resubmitDeadline &&
    existing.resubmitDeadline < new Date()
  ) {
    throw new Error('PACKAGING_RESUBMIT_EXPIRED')
  }

  const media = await uploadRekberPackagingMediaFiles(rekberId, sellerId, photos, videos)
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    let proofId = existing?.id
    if (proofId) {
      await tx.rekberPackagingMedia.deleteMany({ where: { proofId } })
      await tx.rekberPackagingProof.update({
        where: { id: proofId },
        data: {
          status: 'PENDING',
          rejectionNote: null,
          submittedAt: now,
          rejectedAt: null,
          resubmitDeadline: null,
          reviewedAt: null,
          reviewedById: null,
          slaNotifiedAt: null,
        },
      })
    } else {
      const created = await tx.rekberPackagingProof.create({
        data: {
          rekberId,
          sellerId,
          status: 'PENDING',
          submittedAt: now,
        },
      })
      proofId = created.id
    }

    await tx.rekberPackagingMedia.createMany({
      data: media.map((m) => ({
        proofId: proofId!,
        type: m.type,
        url: m.url,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes,
      })),
    })
  })

  void logOrderEvent({
    action: 'rekber.packaging_submitted',
    severity: 'INFO',
    summary: `Bukti packaging rekber dikirim — ${rekber.orderCode}`,
    actor,
    target: { type: 'rekber', id: rekberId, label: rekber.orderCode },
  })
}

export async function reviewRekberPackagingProof(
  proofId: string,
  adminId: string,
  action: 'approve' | 'reject',
  note: string | undefined,
  actor: ActivityActor,
) {
  const proof = await prisma.rekberPackagingProof.findUnique({
    where: { id: proofId },
    include: { rekber: { select: { orderCode: true } } },
  })
  if (!proof) throw new Error('PROOF_NOT_FOUND')
  if (proof.status !== 'PENDING') throw new Error('PROOF_NOT_PENDING')
  if (action === 'reject' && (!note || note.trim().length < 5)) {
    throw new Error('REJECTION_NOTE_REQUIRED')
  }

  const now = new Date()
  if (action === 'approve') {
    await prisma.rekberPackagingProof.update({
      where: { id: proofId },
      data: {
        status: 'APPROVED',
        reviewedAt: now,
        reviewedById: adminId,
        rejectionNote: null,
      },
    })
    void logOrderEvent({
      action: 'rekber.packaging_approved',
      severity: 'INFO',
      summary: `Bukti packaging rekber disetujui — ${proof.rekber.orderCode}`,
      actor,
      target: { type: 'rekber', id: proof.rekberId, label: proof.rekber.orderCode },
    })
    return
  }

  await prisma.rekberPackagingProof.update({
    where: { id: proofId },
    data: {
      status: 'REJECTED',
      rejectionNote: note!.trim(),
      rejectedAt: now,
      resubmitDeadline: addDays(now, PACKAGING_RESUBMIT_DAYS),
      reviewedAt: now,
      reviewedById: adminId,
    },
  })

  void logOrderEvent({
    action: 'rekber.packaging_rejected',
    severity: 'WARNING',
    summary: `Bukti packaging rekber ditolak — ${proof.rekber.orderCode}`,
    actor,
    target: { type: 'rekber', id: proof.rekberId, label: proof.rekber.orderCode },
  })
}

export async function getRekberPackagingProof(rekberId: string, sellerId: string) {
  const rekber = await prisma.rekberTransaction.findFirst({
    where: { id: rekberId, sellerId },
    include: { packagingProof: { include: { media: true } } },
  })
  if (!rekber) throw new Error('REKBER_NOT_FOUND')
  return rekber.packagingProof
}
