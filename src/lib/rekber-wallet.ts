import type { Prisma } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'
import { hasWalletLedgerByUser } from '@/lib/wallet/ledger-idempotency'

type TxClient = Prisma.TransactionClient

/** Potong saldo buyer (nominal + fee) dan catat escrow hold */
export async function holdRekberFunds(
  tx: TxClient,
  buyerId: string,
  totalHold: PrismaNamespace.Decimal,
  rekberId: string,
  orderCode: string,
) {
  if (await hasWalletLedgerByUser(tx, buyerId, 'ESCROW_HOLD', rekberId)) return

  const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(totalHold)) throw new Error('INSUFFICIENT_BALANCE')

  const newBalance = wallet.balance.sub(totalHold)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'ESCROW_HOLD',
      amount: totalHold.neg(),
      balance: newBalance,
      description: `Rekber hold ${orderCode}`,
      referenceId: rekberId,
    },
  })
}

/** Lepaskan dana ke seller (nominal transaksi, tanpa fee) */
export async function releaseRekberToSeller(
  tx: TxClient,
  sellerId: string,
  amount: PrismaNamespace.Decimal,
  rekberId: string,
  orderCode: string,
) {
  if (await hasWalletLedgerByUser(tx, sellerId, 'ESCROW_RELEASE', rekberId)) return

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
      type: 'ESCROW_RELEASE',
      amount,
      balance: newBalance,
      description: `Rekber release ${orderCode}`,
      referenceId: rekberId,
    },
  })
}

/** Kembalikan total hold ke buyer */
export async function refundRekberToBuyer(
  tx: TxClient,
  buyerId: string,
  totalHold: PrismaNamespace.Decimal,
  rekberId: string,
  orderCode: string,
) {
  if (await hasWalletLedgerByUser(tx, buyerId, 'REFUND', rekberId)) return

  const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(totalHold)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'REFUND',
      amount: totalHold,
      balance: newBalance,
      description: `Rekber refund ${orderCode}`,
      referenceId: rekberId,
    },
  })
}

/** Partial settlement: refund sebagian ke buyer, sisa nominal ke seller */
export async function partialRekberSettlement(
  tx: TxClient,
  buyerId: string,
  sellerId: string,
  refundToBuyer: PrismaNamespace.Decimal,
  releaseToSeller: PrismaNamespace.Decimal,
  rekberId: string,
  orderCode: string,
) {
  if (refundToBuyer.greaterThan(0)) {
    const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
    if (!buyerWallet) throw new Error('WALLET_NOT_FOUND')
    const buyerBalance = buyerWallet.balance.add(refundToBuyer)
    await tx.wallet.update({
      where: { id: buyerWallet.id },
      data: { balance: buyerBalance },
    })
    await tx.walletLedger.create({
      data: {
        walletId: buyerWallet.id,
        type: 'REFUND',
        amount: refundToBuyer,
        balance: buyerBalance,
        description: `Rekber partial refund ${orderCode}`,
        referenceId: rekberId,
      },
    })
  }

  if (releaseToSeller.greaterThan(0)) {
    await releaseRekberToSeller(tx, sellerId, releaseToSeller, rekberId, orderCode)
  }
}
