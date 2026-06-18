import type { OrderStatus, Prisma, LedgerType } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logPaymentEvent } from '@/lib/activity-log'
import { walletTransaction } from '@/lib/wallet/transaction'

type TxClient = Prisma.TransactionClient

const SETTLED_ORDER_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED']
const ACTIVE_ESCROW_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DISPUTED']

async function hasLedger(
  tx: TxClient,
  referenceId: string,
  type: LedgerType,
  userId: string,
) {
  const row = await tx.walletLedger.findFirst({
    where: { type, referenceId, wallet: { userId } },
  })
  return Boolean(row)
}

/** Potong saldo pembeli dan catat escrow hold untuk order marketplace v2. */
export async function holdBuyerForMarketplace(
  tx: TxClient,
  buyerId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
  orderCode: string,
) {
  if (await hasLedger(tx, orderId, 'ESCROW_HOLD', buyerId)) return

  const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(amount)) throw new Error('INSUFFICIENT_BALANCE')

  const newBalance = wallet.balance.sub(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'ESCROW_HOLD',
      amount: amount.neg(),
      balance: newBalance,
      description: `Dana ditahan — ${orderCode}`,
      referenceId: orderId,
    },
  })
}

/** Release neto ke penjual saat order COMPLETED (escrow v2). */
export async function releaseSellerForMarketplace(
  tx: TxClient,
  sellerId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
  orderCode: string,
  sellerFeePercent: number,
) {
  if (await hasLedger(tx, orderId, 'EARNING', sellerId)) return

  const wallet = await tx.wallet.findUnique({ where: { userId: sellerId } })
  if (!wallet) throw new Error('SELLER_WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'EARNING',
      amount,
      balance: newBalance,
      description: `Penjualan ${orderCode} (setelah fee platform ${sellerFeePercent}%)`,
      referenceId: orderId,
    },
  })
}

/** Kembalikan hold pembeli (full atau partial). */
export async function refundBuyerHoldForMarketplace(
  tx: TxClient,
  buyerId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
  description: string,
) {
  if (await hasLedger(tx, orderId, 'REFUND', buyerId)) return

  const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'REFUND',
      amount,
      balance: newBalance,
      description,
      referenceId: orderId,
    },
  })
}

export async function logPlatformFeeForOrder(
  orderId: string,
  orderCode: string,
  buyerFee: PrismaNamespace.Decimal,
  sellerFee: PrismaNamespace.Decimal,
) {
  void logPaymentEvent({
    action: 'marketplace.platform_fee',
    severity: 'INFO',
    summary: `Fee platform ${orderCode}`,
    target: { type: 'marketplace_order', id: orderId, label: orderCode },
    metadata: {
      buyerFee: buyerFee.toString(),
      sellerFee: sellerFee.toString(),
      totalFee: buyerFee.add(sellerFee).toString(),
    },
  })
}

/** @deprecated Legacy immediate debit — gunakan holdBuyerForMarketplace untuk order v2. */
export async function debitBuyerForMarketplace(
  tx: TxClient,
  buyerId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(amount)) throw new Error('INSUFFICIENT_BALANCE')

  const newBalance = wallet.balance.sub(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'PAYMENT',
      amount: amount.neg(),
      balance: newBalance,
      description,
      referenceId: orderId,
    },
  })
}

/** @deprecated Legacy immediate credit — gunakan releaseSellerForMarketplace untuk order v2. */
export async function creditSellerForMarketplace(
  tx: TxClient,
  sellerId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId: sellerId } })
  if (!wallet) throw new Error('SELLER_WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'EARNING',
      amount,
      balance: newBalance,
      description,
      referenceId: orderId,
    },
  })
}

export async function refundBuyerForMarketplace(
  tx: TxClient,
  buyerId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
  description: string,
) {
  await refundBuyerHoldForMarketplace(tx, buyerId, amount, orderId, description)
}

/** Legacy cancel — kurangi saldo penjual yang sudah dikredit saat checkout v1. */
export async function debitSellerForMarketplace(
  tx: TxClient,
  sellerId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId: sellerId } })
  if (!wallet) throw new Error('SELLER_WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(amount)) throw new Error('INSUFFICIENT_SELLER_BALANCE')

  const newBalance = wallet.balance.sub(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'PAYMENT',
      amount: amount.neg(),
      balance: newBalance,
      description,
      referenceId: orderId,
    },
  })
}

async function orderHasBuyerRefund(orderId: string, buyerId: string) {
  const refunded = await prisma.walletLedger.findFirst({
    where: {
      type: 'REFUND',
      referenceId: orderId,
      wallet: { userId: buyerId },
    },
  })
  return Boolean(refunded)
}

export async function getBuyerEscrowSummary(buyerId: string) {
  const orders = await prisma.order.findMany({
    where: {
      buyerId,
      settlementVersion: 2,
      status: { in: ACTIVE_ESCROW_STATUSES },
    },
    select: {
      id: true,
      orderCode: true,
      buyerHoldAmount: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const pendingHolds: Array<{ orderId: string; orderCode: string; amount: string }> = []
  let heldBalance = 0

  for (const order of orders) {
    if (await orderHasBuyerRefund(order.id, buyerId)) continue
    const amount = Number(order.buyerHoldAmount)
    if (amount <= 0) continue
    heldBalance += amount
    pendingHolds.push({
      orderId: order.id,
      orderCode: order.orderCode,
      amount: order.buyerHoldAmount.toString(),
    })
  }

  return { heldBalance, pendingHolds }
}

export async function getSellerPendingEarnings(sellerId: string) {
  const orders = await prisma.order.findMany({
    where: {
      sellerId,
      settlementVersion: 2,
      status: { in: ACTIVE_ESCROW_STATUSES },
    },
    select: { sellerNetAmount: true },
  })

  return orders.reduce((sum, o) => sum + Number(o.sellerNetAmount), 0)
}

/**
 * Legacy settlement — debit pembeli + kredit penjual segera (settlementVersion 1).
 */
export async function ensureMarketplaceOrderSettlement(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      buyerId: true,
      sellerId: true,
      total: true,
      status: true,
      settlementVersion: true,
    },
  })
  if (!order || order.settlementVersion !== 1) return false
  if (!SETTLED_ORDER_STATUSES.includes(order.status)) return false

  const sellerCredited = await prisma.walletLedger.findFirst({
    where: {
      type: 'EARNING',
      referenceId: orderId,
      wallet: { userId: order.sellerId },
    },
  })
  if (sellerCredited) return false

  await walletTransaction(async (tx) => {
    const buyerPaid = await tx.walletLedger.findFirst({
      where: {
        type: 'PAYMENT',
        referenceId: orderId,
        wallet: { userId: order.buyerId },
      },
    })
    if (!buyerPaid) {
      await debitBuyerForMarketplace(
        tx,
        order.buyerId,
        order.total,
        orderId,
        `Pembelian marketplace ${order.orderCode}`,
      )
    }
    await creditSellerForMarketplace(
      tx,
      order.sellerId,
      order.total,
      orderId,
      `Penjualan marketplace ${order.orderCode}`,
    )
  })

  return true
}

export async function releaseEscrowOrderToSeller(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      sellerId: true,
      sellerNetAmount: true,
      buyerFeeAmount: true,
      sellerFeeAmount: true,
      settlementVersion: true,
      status: true,
    },
  })
  if (!order || order.settlementVersion !== 2) return false
  if (order.status !== 'COMPLETED') return false

  const sellerFeePercent =
    Number(order.sellerFeeAmount) > 0 && Number(order.sellerNetAmount) > 0
      ? Math.round(
          (Number(order.sellerFeeAmount) /
            (Number(order.sellerNetAmount) + Number(order.sellerFeeAmount))) *
            1000,
        ) / 10
      : 0

  await walletTransaction(async (tx) => {
    await releaseSellerForMarketplace(
      tx,
      order.sellerId,
      order.sellerNetAmount,
      order.id,
      order.orderCode,
      sellerFeePercent,
    )
  })

  void logPlatformFeeForOrder(
    order.id,
    order.orderCode,
    order.buyerFeeAmount,
    order.sellerFeeAmount,
  )

  return true
}

/** Perbaiki order penjual legacy yang belum punya entri EARNING (maks. batchSize). */
export async function repairUnsettledMarketplaceOrdersForSeller(
  sellerId: string,
  batchSize = 15,
): Promise<number> {
  const orders = await prisma.order.findMany({
    where: {
      sellerId,
      settlementVersion: 1,
      status: { in: SETTLED_ORDER_STATUSES },
    },
    orderBy: { createdAt: 'desc' },
    take: batchSize,
    select: { id: true },
  })

  let repaired = 0
  for (const { id } of orders) {
    try {
      const did = await ensureMarketplaceOrderSettlement(id)
      if (did) repaired += 1
    } catch (e) {
      if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') continue
      throw e
    }
  }
  return repaired
}
