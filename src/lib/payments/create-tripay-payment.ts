import { Prisma, type PaymentIntentPurpose } from '@prisma/client'
import { prisma } from '@/lib/db'
import { generateMerchantRef, serializePaymentIntent } from '@/lib/payments/payment-intent'
import { tripayCreateTransaction, tripayFeeCalculator } from '@/lib/tripay/client'
import { getTripayConfig } from '@/lib/tripay/config'
import { KONSULTASI_PAYMENT_TTL_MS } from '@/lib/payment-gateway'

export type CreateTripayPaymentInput = {
  purpose: PaymentIntentPurpose
  userId: string
  channelCode: string
  subtotal: number
  targetId?: string | null
  orderItemName: string
  returnUrlBase: string
  expiredTimeSeconds?: number
  onBeforeCreate?: (merchantRef: string) => Promise<void>
}

export async function createTripayPaymentIntent(input: CreateTripayPaymentInput) {
  const cfg = getTripayConfig()
  if (!cfg.isConfigured) throw new Error('TRIPAY_NOT_CONFIGURED')

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, name: true, email: true, phone: true },
  })
  if (!user?.email) throw new Error('USER_EMAIL_MISSING')

  const feeResult = await tripayFeeCalculator(input.subtotal, input.channelCode)
  const merchantFee = feeResult.total_fee.merchant
  const customerFee = feeResult.total_fee.customer
  const feeAmount = merchantFee + customerFee
  const amount = input.subtotal + customerFee

  const merchantRef = generateMerchantRef()
  const returnUrl = `${input.returnUrlBase}/payments/${merchantRef}?status=return`
  const expiredSeconds =
    input.expiredTimeSeconds ?? Math.floor(KONSULTASI_PAYMENT_TTL_MS / 1000)

  if (input.onBeforeCreate) {
    await input.onBeforeCreate(merchantRef)
  }

  const tripayTx = await tripayCreateTransaction({
    method: input.channelCode,
    merchantRef,
    amount,
    customerName: user.name || 'Pelanggan Bantoo',
    customerEmail: user.email,
    customerPhone: user.phone ?? undefined,
    orderItems: [{ name: input.orderItemName, price: input.subtotal, quantity: 1 }],
    returnUrl,
    expiredTimeSeconds: expiredSeconds,
  })

  const expiredAt = tripayTx.expired_time
    ? new Date(tripayTx.expired_time * 1000)
    : new Date(Date.now() + expiredSeconds * 1000)

  const intent = await prisma.paymentIntent.create({
    data: {
      merchantRef,
      purpose: input.purpose,
      userId: user.id,
      targetId: input.targetId ?? null,
      subtotal: new Prisma.Decimal(input.subtotal),
      feeAmount: new Prisma.Decimal(feeAmount),
      amount: new Prisma.Decimal(amount),
      channelCode: input.channelCode,
      channelName: feeResult.name,
      channelType: null,
      tripayReference: tripayTx.reference,
      status: 'UNPAID',
      payCode: tripayTx.pay_code,
      qrUrl: tripayTx.qr_url,
      qrString: tripayTx.qr_string,
      checkoutUrl: tripayTx.checkout_url,
      payUrl: tripayTx.pay_url,
      returnUrl,
      expiredAt,
    },
  })

  return serializePaymentIntent(intent)
}
