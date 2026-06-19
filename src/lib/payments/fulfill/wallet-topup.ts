import type { Prisma as PrismaNamespace, Prisma } from '@prisma/client'
import { buildGatewayDepositDescription } from '@/lib/admin-saldo'
import { executeWalletDepositInTx } from '@/lib/wallet/deposit'
import { decimalToNumber } from '@/lib/payments/payment-intent'

type WalletTopupIntent = {
  id: string
  merchantRef: string
  userId: string
  subtotal: Prisma.Decimal
  channelCode: string
  channelName: string | null
}

export async function fulfillWalletTopupInTx(
  tx: PrismaNamespace.TransactionClient,
  intent: WalletTopupIntent,
) {
  const subtotal = decimalToNumber(intent.subtotal)
  const channelLabel = intent.channelName ?? intent.channelCode
  await executeWalletDepositInTx(tx, {
    userId: intent.userId,
    amount: subtotal,
    description: buildGatewayDepositDescription(channelLabel, intent.merchantRef),
    referenceId: intent.id,
    ledgerType: 'TOPUP',
  })
}
