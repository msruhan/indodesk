import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logOrderEvent } from '@/lib/activity-log'
import type { ActivityActor } from '@/lib/activity-log'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import {
  debitSellerForMarketplace,
  refundBuyerHoldForMarketplace,
  releaseSellerForMarketplace,
  logPlatformFeeForOrder,
} from '@/lib/marketplace-wallet'
import { marketplaceComplaintResolveSchema } from '@/lib/validations/marketplace-complaint'
import { walletTransaction } from '@/lib/wallet/transaction'

export async function resolveMarketplaceComplaint(
  complaintId: string,
  adminId: string,
  input: unknown,
  actor: ActivityActor,
) {
  const parsed = marketplaceComplaintResolveSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const complaint = await prisma.orderComplaint.findUnique({
    where: { id: complaintId },
    include: { order: true },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')
  if (complaint.status !== 'ESCALATED') throw new Error('INVALID_COMPLAINT_STATUS')

  const order = complaint.order
  const subtotal = Number(order.total)
  const holdAmount = Number(order.buyerHoldAmount) > 0 ? Number(order.buyerHoldAmount) : subtotal
  const sellerNet = Number(order.sellerNetAmount) > 0 ? Number(order.sellerNetAmount) : subtotal
  const isEscrow = order.settlementVersion === 2

  if (parsed.data.resolution === 'REFUND_PARTIAL') {
    const amount = parsed.data.refundAmount
    if (amount == null || amount <= 0 || amount >= subtotal) {
      throw new Error('REFUND_AMOUNT_INVALID')
    }
  }

  const refundAmount =
    parsed.data.resolution === 'REFUND_FULL'
      ? isEscrow
        ? holdAmount
        : subtotal
      : parsed.data.resolution === 'REFUND_PARTIAL'
        ? (parsed.data.refundAmount ?? 0)
        : 0

  const now = new Date()

  await walletTransaction(async (tx) => {
    if (isEscrow) {
      if (parsed.data.resolution === 'REFUND_FULL') {
        await refundBuyerHoldForMarketplace(
          tx,
          order.buyerId,
          new Prisma.Decimal(holdAmount),
          order.id,
          `Refund komplain ${order.orderCode}`,
        )
      } else if (parsed.data.resolution === 'REFUND_PARTIAL' && refundAmount > 0) {
        await refundBuyerHoldForMarketplace(
          tx,
          order.buyerId,
          new Prisma.Decimal(refundAmount),
          order.id,
          `Refund sebagian komplain ${order.orderCode}`,
        )
        const sellerRelease = Math.max(
          0,
          sellerNet - Math.floor((refundAmount / subtotal) * sellerNet),
        )
        if (sellerRelease > 0) {
          const sellerFeePercent =
            Number(order.sellerFeeAmount) > 0
              ? Math.round((Number(order.sellerFeeAmount) / subtotal) * 1000) / 10
              : 0
          await releaseSellerForMarketplace(
            tx,
            order.sellerId,
            new Prisma.Decimal(sellerRelease),
            order.id,
            order.orderCode,
            sellerFeePercent,
          )
        }
      } else if (parsed.data.resolution === 'REJECTED') {
        const sellerFeePercent =
          Number(order.sellerFeeAmount) > 0
            ? Math.round((Number(order.sellerFeeAmount) / subtotal) * 1000) / 10
            : 0
        await releaseSellerForMarketplace(
          tx,
          order.sellerId,
          new Prisma.Decimal(sellerNet),
          order.id,
          order.orderCode,
          sellerFeePercent,
        )
      }
    } else if (refundAmount > 0) {
      await refundBuyerHoldForMarketplace(
        tx,
        order.buyerId,
        new Prisma.Decimal(refundAmount),
        order.id,
        `Refund komplain ${order.orderCode}`,
      )
      await debitSellerForMarketplace(
        tx,
        order.sellerId,
        new Prisma.Decimal(refundAmount),
        order.id,
        `Refund komplain ${order.orderCode}`,
      )
    }

    await tx.orderComplaint.update({
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

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: parsed.data.resolution === 'REFUND_FULL' ? 'REFUNDED' : 'COMPLETED',
        completedAt: parsed.data.resolution === 'REFUND_FULL' ? null : now,
        trackingActive: false,
        trackingNextSyncAt: null,
      },
    })
  })

  if (isEscrow && parsed.data.resolution === 'REJECTED') {
    void logPlatformFeeForOrder(
      order.id,
      order.orderCode,
      order.buyerFeeAmount,
      order.sellerFeeAmount,
    )
  }

  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: MARKETPLACE_ORDER_INCLUDE,
  })
  if (!updated) throw new Error('ORDER_NOT_FOUND')

  void logOrderEvent({
    action: 'marketplace.complaint_resolved',
    severity: 'INFO',
    summary: `Komplain ${order.orderCode} → ${parsed.data.resolution}`,
    actor,
    target: { type: 'marketplace_order', id: order.id, label: order.orderCode },
  })

  return serializeMarketplaceOrder(updated, { viewerId: adminId, viewerRole: 'ADMIN' })
}

export async function resolveComplaintRefundFull(
  complaintId: string,
  actor: ActivityActor,
  opts?: { auto?: boolean },
) {
  const complaint = await prisma.orderComplaint.findUnique({
    where: { id: complaintId },
    include: { order: true },
  })
  if (!complaint) throw new Error('COMPLAINT_NOT_FOUND')
  if (complaint.status !== 'AWAITING_SELLER_CONFIRM') {
    throw new Error('INVALID_COMPLAINT_STATUS')
  }

  const order = complaint.order
  const holdAmount =
    Number(order.buyerHoldAmount) > 0 ? Number(order.buyerHoldAmount) : Number(order.total)
  const now = new Date()

  await walletTransaction(async (tx) => {
    await refundBuyerHoldForMarketplace(
      tx,
      order.buyerId,
      new Prisma.Decimal(holdAmount),
      order.id,
      opts?.auto
        ? `Auto-refund retur ${order.orderCode}`
        : `Refund retur ${order.orderCode}`,
    )

    await tx.orderComplaint.update({
      where: { id: complaintId },
      data: {
        status: 'RESOLVED',
        resolution: 'REFUND_FULL',
        refundAmount: holdAmount,
        resolvedAt: now,
        adminNote: opts?.auto ? 'Auto-refund: penjual tidak merespons dalam 2 hari' : null,
      },
    })

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        trackingActive: false,
        trackingNextSyncAt: null,
      },
    })
  })

  void logOrderEvent({
    action: opts?.auto
      ? 'marketplace.complaint_return_auto_refund'
      : 'marketplace.complaint_return_confirmed',
    severity: 'INFO',
    summary: `Refund retur ${order.orderCode}`,
    actor,
    target: { type: 'marketplace_order', id: order.id, label: order.orderCode },
  })
}
