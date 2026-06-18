import { prisma } from '@/lib/db'
import { logOrderEvent } from '@/lib/activity-log'
import type { ActivityActor } from '@/lib/activity-log'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { uploadReturnComplaintMediaFiles } from '@/lib/marketplace-complaint-media'
import { resolveComplaintRefundFull } from '@/lib/marketplace-complaint-resolve'
import { syncReturnTrackingFromBinderbyte } from '@/lib/return-tracking-sync'
import {
  MARKETPLACE_RETURN_PHOTO_MIN,
  MARKETPLACE_RETURN_REJECT_PHOTO_MIN,
  MARKETPLACE_RETURN_VIDEO_MIN,
  marketplaceComplaintReturnRejectSchema,
  marketplaceComplaintReturnSchema,
} from '@/lib/validations/marketplace-complaint-return'
import type { SellerReturnAddressDto } from '@/lib/marketplace-order-complaint-serializer'
import type { ShippingCourier } from '@prisma/client'

export async function getSellerReturnAddress(sellerId: string) {
  const store = await prisma.teknisiStore.findUnique({
    where: { userId: sellerId },
    select: { name: true, address: true, city: true, phone: true },
  })
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { name: true, phone: true },
  })
  return {
    storeName: store?.name ?? seller?.name ?? 'Penjual',
    address: store?.address ?? null,
    city: store?.city ?? null,
    phone: store?.phone ?? seller?.phone ?? null,
  }
}

export async function submitMarketplaceComplaintReturn(
  orderId: string,
  buyerId: string,
  courier: ShippingCourier,
  trackingNumber: string,
  returnPhotos: File[],
  returnVideos: File[],
  actor: ActivityActor,
) {
  const parsed = marketplaceComplaintReturnSchema.safeParse({ courier, trackingNumber })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Data retur tidak valid')
  }
  if (returnPhotos.length < MARKETPLACE_RETURN_PHOTO_MIN) {
    throw new Error('RETURN_PHOTO_REQUIRED')
  }
  if (returnVideos.length < MARKETPLACE_RETURN_VIDEO_MIN) {
    throw new Error('RETURN_VIDEO_REQUIRED')
  }

  const complaint = await prisma.orderComplaint.findFirst({
    where: { orderId, buyerId, status: 'AWAITING_RETURN' },
    include: { order: true },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')
  if (!complaint.returnDeadline || complaint.returnDeadline < new Date()) {
    throw new Error('RETURN_DEADLINE_PASSED')
  }

  const media = await uploadReturnComplaintMediaFiles(
    orderId,
    buyerId,
    returnPhotos,
    returnVideos,
  )
  const now = new Date()
  const awb = parsed.data.trackingNumber.trim().replace(/\s+/g, '')

  await prisma.$transaction(async (tx) => {
    await tx.orderComplaint.update({
      where: { id: complaint.id },
      data: {
        status: 'RETURN_SHIPPED',
        returnCourier: parsed.data.courier,
        returnTrackingNumber: awb,
        returnShippedAt: now,
        returnTrackingActive: true,
        returnNextSyncAt: now,
        returnSyncFailures: 0,
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
  })

  try {
    await syncReturnTrackingFromBinderbyte({
      complaintId: complaint.id,
      courier: parsed.data.courier,
      trackingNumber: awb,
    })
  } catch {
    /* polling cron will retry */
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: MARKETPLACE_ORDER_INCLUDE,
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')

  void logOrderEvent({
    action: 'marketplace.complaint_return_submitted',
    severity: 'INFO',
    summary: `Retur dikirim ${order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: orderId, label: order.orderCode },
  })

  return serializeMarketplaceOrder(order, { viewerId: buyerId, viewerRole: 'USER' })
}

export async function confirmMarketplaceComplaintReturn(
  orderId: string,
  sellerId: string,
  actor: ActivityActor,
) {
  const complaint = await prisma.orderComplaint.findFirst({
    where: { orderId, sellerId, status: 'AWAITING_SELLER_CONFIRM' },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')

  await resolveComplaintRefundFull(complaint.id, actor)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: MARKETPLACE_ORDER_INCLUDE,
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')

  return serializeMarketplaceOrder(order, { viewerId: sellerId, viewerRole: 'TEKNISI' })
}

export async function rejectMarketplaceComplaintReturn(
  orderId: string,
  sellerId: string,
  reason: string,
  rejectPhotos: File[],
  actor: ActivityActor,
) {
  const parsed = marketplaceComplaintReturnRejectSchema.safeParse({ reason })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Alasan tidak valid')
  }
  if (rejectPhotos.length < MARKETPLACE_RETURN_REJECT_PHOTO_MIN) {
    throw new Error('REJECT_PHOTO_REQUIRED')
  }

  const complaint = await prisma.orderComplaint.findFirst({
    where: { orderId, sellerId, status: 'AWAITING_SELLER_CONFIRM' },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')

  const media = await uploadReturnComplaintMediaFiles(
    orderId,
    sellerId,
    rejectPhotos,
    [],
    'RETURN_REJECT_PHOTO',
  )
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.orderComplaint.update({
      where: { id: complaint.id },
      data: {
        status: 'ESCALATED',
        escalatedAt: now,
        sellerReturnRejectReason: parsed.data.reason,
        sellerReturnRejectedAt: now,
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
  })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: MARKETPLACE_ORDER_INCLUDE,
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')

  void logOrderEvent({
    action: 'marketplace.complaint_return_rejected',
    severity: 'WARNING',
    summary: `Penjual tolak retur ${order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: orderId, label: order.orderCode },
  })

  return serializeMarketplaceOrder(order, { viewerId: sellerId, viewerRole: 'TEKNISI' })
}

export async function loadSellerReturnAddressMap(
  sellerIds: string[],
): Promise<Map<string, SellerReturnAddressDto>> {
  const unique = [...new Set(sellerIds)]
  if (unique.length === 0) return new Map()

  const stores = await prisma.teknisiStore.findMany({
    where: { userId: { in: unique } },
    select: { userId: true, name: true, address: true, city: true, phone: true },
  })
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, phone: true },
  })

  const userById = new Map(users.map((u) => [u.id, u]))
  const map = new Map<string, SellerReturnAddressDto>()

  for (const id of unique) {
    const store = stores.find((s) => s.userId === id)
    const user = userById.get(id)
    map.set(id, {
      storeName: store?.name ?? user?.name ?? 'Penjual',
      address: store?.address ?? null,
      city: store?.city ?? null,
      phone: store?.phone ?? user?.phone ?? null,
    })
  }

  return map
}
