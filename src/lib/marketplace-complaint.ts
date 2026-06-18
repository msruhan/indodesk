import { prisma } from '@/lib/db'
import { logOrderEvent } from '@/lib/activity-log'
import type { ActivityActor } from '@/lib/activity-log'
import { addDays, SELLER_RESPONSE_DAYS } from '@/lib/marketplace-order-deadlines'
import { computeReturnDeadline } from '@/lib/marketplace-return-deadlines'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { uploadComplaintMediaFiles } from '@/lib/marketplace-complaint-media'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'
import {
  MARKETPLACE_COMPLAINT_PHOTO_MIN,
  MARKETPLACE_COMPLAINT_VIDEO_MIN,
  marketplaceComplaintReasonSchema,
  marketplaceComplaintSellerResponseSchema,
} from '@/lib/validations/marketplace-complaint'

export async function createMarketplaceOrderComplaint(
  orderId: string,
  buyerId: string,
  reason: string,
  defectPhotos: File[],
  unboxingVideos: File[],
  actor: ActivityActor,
) {
  const parsedReason = marketplaceComplaintReasonSchema.safeParse(reason)
  if (!parsedReason.success) {
    throw new Error(parsedReason.error.issues[0]?.message ?? 'Alasan tidak valid')
  }
  if (defectPhotos.length < MARKETPLACE_COMPLAINT_PHOTO_MIN) {
    throw new Error('DEFECT_PHOTO_REQUIRED')
  }
  if (unboxingVideos.length < MARKETPLACE_COMPLAINT_VIDEO_MIN) {
    throw new Error('UNBOXING_VIDEO_REQUIRED')
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId },
    include: MARKETPLACE_ORDER_INCLUDE,
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')
  if (order.status !== 'SHIPPED') throw new Error('INVALID_STATUS')
  if (!isTerminalTrackingStatus(order.trackingSummaryStatus)) throw new Error('NOT_DELIVERED')
  if (order.buyerActionDeadline && order.buyerActionDeadline < new Date()) {
    throw new Error('DEADLINE_PASSED')
  }
  if (order.complaint) throw new Error('COMPLAINT_EXISTS')

  const media = await uploadComplaintMediaFiles(orderId, buyerId, defectPhotos, unboxingVideos)
  const now = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    await tx.orderComplaint.create({
      data: {
        orderId,
        buyerId,
        sellerId: order.sellerId,
        reason: parsedReason.data,
        type: 'RETURN_REQUIRED',
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

    return tx.order.update({
      where: { id: orderId },
      data: { status: 'DISPUTED' },
      include: MARKETPLACE_ORDER_INCLUDE,
    })
  })

  void logOrderEvent({
    action: 'marketplace.complaint_filed',
    severity: 'WARNING',
    summary: `Komplain ${order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: orderId, label: order.orderCode },
  })

  return serializeMarketplaceOrder(updated, { viewerId: buyerId, viewerRole: 'USER' })
}

export async function respondToMarketplaceComplaint(
  orderId: string,
  sellerId: string,
  response: string,
  actor: ActivityActor,
) {
  const parsed = marketplaceComplaintSellerResponseSchema.safeParse(response)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Respons tidak valid')
  }

  const complaint = await prisma.orderComplaint.findFirst({
    where: { orderId, sellerId, status: 'OPEN' },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')
  if (complaint.sellerDeadline < new Date()) throw new Error('SELLER_DEADLINE_PASSED')

  const now = new Date()
  await prisma.orderComplaint.update({
    where: { id: complaint.id },
    data: {
      status: 'AWAITING_RETURN',
      sellerResponse: parsed.data,
      sellerRespondedAt: now,
      returnDeadline: computeReturnDeadline(now),
    },
  })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: MARKETPLACE_ORDER_INCLUDE,
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')

  void logOrderEvent({
    action: 'marketplace.complaint_seller_responded',
    severity: 'INFO',
    summary: `Respons komplain ${order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: orderId, label: order.orderCode },
  })

  return serializeMarketplaceOrder(order, { viewerId: sellerId, viewerRole: 'TEKNISI' })
}

export async function escalateMarketplaceComplaint(
  orderId: string,
  buyerId: string,
  actor: ActivityActor,
) {
  const complaint = await prisma.orderComplaint.findFirst({
    where: { orderId, buyerId, status: 'SELLER_RESPONDED' },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')

  const now = new Date()
  await prisma.orderComplaint.update({
    where: { id: complaint.id },
    data: { status: 'ESCALATED', escalatedAt: now },
  })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: MARKETPLACE_ORDER_INCLUDE,
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')

  void logOrderEvent({
    action: 'marketplace.complaint_escalated',
    severity: 'WARNING',
    summary: `Eskalasi komplain ${order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: orderId, label: order.orderCode },
  })

  return serializeMarketplaceOrder(order, { viewerId: buyerId, viewerRole: 'USER' })
}
