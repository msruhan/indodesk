import type { OrderStatus, Prisma } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'
import { prisma } from '@/lib/db'

type TxClient = Prisma.TransactionClient

const SETTLED_ORDER_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED']

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

/** Batalkan penjualan — kurangi saldo penjual (balik dari EARNING saat checkout). */
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

/**
 * Pastikan pembayaran marketplace tercatat di wallet (pembeli debet, penjual kredit).
 * Idempotent — aman dipanggil ulang setelah checkout atau untuk order lama/seed.
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
    },
  })
  if (!order || !SETTLED_ORDER_STATUSES.includes(order.status)) return false

  const sellerCredited = await prisma.walletLedger.findFirst({
    where: {
      type: 'EARNING',
      referenceId: orderId,
      wallet: { userId: order.sellerId },
    },
  })
  if (sellerCredited) return false

  await prisma.$transaction(async (tx) => {
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

/** Perbaiki order penjual yang belum punya entri EARNING di ledger (maks. batchSize). */
export async function repairUnsettledMarketplaceOrdersForSeller(
  sellerId: string,
  batchSize = 15,
): Promise<number> {
  const orders = await prisma.order.findMany({
    where: {
      sellerId,
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
