import { prisma } from '@/lib/db'
import { logOrderEvent, type ActivityActor } from '@/lib/activity-log'
import { addDays } from '@/lib/marketplace-order-deadlines'
import { uploadPackagingMediaFiles } from '@/lib/marketplace-packaging-media'
import { orderRequiresPhysicalPackaging } from '@/lib/marketplace-physical-order'
import {
  MARKETPLACE_PACKAGING_PHOTO_MAX_COUNT,
  MARKETPLACE_PACKAGING_PHOTO_MIN,
  MARKETPLACE_PACKAGING_VIDEO_MAX_COUNT,
  MARKETPLACE_PACKAGING_VIDEO_MIN,
  PACKAGING_RESUBMIT_DAYS,
} from '@/lib/validations/marketplace-packaging'
import {
  debitSellerForMarketplace,
  refundBuyerForMarketplace,
} from '@/lib/marketplace-wallet'

export async function submitPackagingProof(
  orderId: string,
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

  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId },
    include: {
      items: { include: { product: { select: { category: true } } } },
      packagingProof: true,
    },
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')
  if (order.status !== 'PAID') throw new Error('INVALID_STATUS')
  if (!orderRequiresPhysicalPackaging(order.items)) {
    throw new Error('PACKAGING_NOT_REQUIRED')
  }

  const existing = order.packagingProof
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

  const media = await uploadPackagingMediaFiles(orderId, sellerId, photos, videos)
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    let proofId = existing?.id
    if (proofId) {
      await tx.orderPackagingMedia.deleteMany({ where: { proofId } })
      await tx.orderPackagingProof.update({
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
      const created = await tx.orderPackagingProof.create({
        data: {
          orderId,
          sellerId,
          status: 'PENDING',
          submittedAt: now,
        },
      })
      proofId = created.id
    }

    await tx.orderPackagingMedia.createMany({
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
    action: 'marketplace.packaging_submitted',
    severity: 'INFO',
    summary: `Bukti packaging dikirim — order ${order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: orderId, label: order.orderCode },
  })
}

export async function reviewPackagingProof(
  proofId: string,
  adminId: string,
  action: 'approve' | 'reject',
  note: string | undefined,
  actor: ActivityActor,
) {
  const proof = await prisma.orderPackagingProof.findUnique({
    where: { id: proofId },
    include: { order: { select: { orderCode: true } } },
  })
  if (!proof) throw new Error('PROOF_NOT_FOUND')
  if (proof.status !== 'PENDING') throw new Error('PROOF_NOT_PENDING')
  if (action === 'reject' && (!note || note.trim().length < 5)) {
    throw new Error('REJECTION_NOTE_REQUIRED')
  }

  const now = new Date()
  if (action === 'approve') {
    await prisma.orderPackagingProof.update({
      where: { id: proofId },
      data: {
        status: 'APPROVED',
        reviewedAt: now,
        reviewedById: adminId,
        rejectionNote: null,
      },
    })
    void logOrderEvent({
      action: 'marketplace.packaging_approved',
      severity: 'INFO',
      summary: `Bukti packaging disetujui — order ${proof.order.orderCode}`,
      actor,
      target: { type: 'marketplace_order', id: proof.orderId, label: proof.order.orderCode },
    })
    return
  }

  await prisma.orderPackagingProof.update({
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
    action: 'marketplace.packaging_rejected',
    severity: 'WARNING',
    summary: `Bukti packaging ditolak — order ${proof.order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: proof.orderId, label: proof.order.orderCode },
  })
}

export async function cancelOrderForPackagingTimeout(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order || order.status !== 'PAID') return false

  const alreadyRefunded = await prisma.walletLedger.findFirst({
    where: {
      type: 'REFUND',
      referenceId: orderId,
      wallet: { userId: order.buyerId },
    },
  })
  if (alreadyRefunded) return false

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      })
    }

    await refundBuyerForMarketplace(
      tx,
      order.buyerId,
      order.total,
      orderId,
      `Refund pembatalan order ${order.orderCode} — bukti packaging tidak diupload`,
    )
    await debitSellerForMarketplace(
      tx,
      order.sellerId,
      order.total,
      orderId,
      `Pembatalan penjualan ${order.orderCode} — bukti packaging expired`,
    )

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        trackingActive: false,
        trackingNextSyncAt: null,
      },
    })
  })

  void logOrderEvent({
    action: 'marketplace.packaging_timeout_cancelled',
    severity: 'WARNING',
    summary: `Order ${order.orderCode} dibatalkan — bukti packaging tidak diupload ulang`,
    actor: { id: 'system', name: 'System', email: null, role: 'ADMIN' },
    target: { type: 'marketplace_order', id: orderId, label: order.orderCode },
  })

  return true
}

export async function getPackagingProofForOrder(orderId: string, sellerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId },
    include: {
      packagingProof: { include: { media: true } },
    },
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')
  return order.packagingProof
}
