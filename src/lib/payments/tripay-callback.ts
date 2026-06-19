import { prisma } from '@/lib/db'
import { fulfillWalletTopupInTx } from '@/lib/payments/fulfill/wallet-topup'
import {
  cancelKonsultasiAwaitingPaymentInTx,
  fulfillKonsultasiPaymentInTx,
} from '@/lib/payments/fulfill/konsultasi'
import {
  cancelMarketplaceAwaitingPaymentInTx,
  fulfillMarketplacePaymentInTx,
} from '@/lib/payments/fulfill/marketplace'
import {
  cancelCatalogTopupAwaitingPaymentInTx,
  fulfillCatalogTopupInTx,
} from '@/lib/payments/fulfill/catalog-topup'
import { mapTripayStatusToIntent } from '@/lib/payments/payment-intent'
import type { TripayCallbackPayload } from '@/lib/tripay/types'

export async function processTripayCallback(payload: TripayCallbackPayload) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { merchantRef: payload.merchant_ref },
  })

  if (!intent) {
    console.warn('[TRIPAY_CALLBACK] Unknown merchant_ref:', payload.merchant_ref)
    return { ok: true as const, message: 'ignored' }
  }

  const mappedStatus = mapTripayStatusToIntent(payload.status)
  if (!mappedStatus) {
    console.warn('[TRIPAY_CALLBACK] Unknown status:', payload.status)
    return { ok: true as const, message: 'ignored_status' }
  }

  if (intent.status === 'PAID' && mappedStatus === 'PAID') {
    return { ok: true as const, message: 'already_paid' }
  }

  const expectedAmount = Number(intent.amount.toString())
  if (payload.total_amount !== expectedAmount) {
    console.error('[TRIPAY_CALLBACK] Amount mismatch', {
      merchantRef: payload.merchant_ref,
      expected: expectedAmount,
      received: payload.total_amount,
    })
    return { ok: false as const, message: 'amount_mismatch' }
  }

  if (mappedStatus === 'PAID') {
    await prisma.$transaction(async (tx) => {
      const current = await tx.paymentIntent.findUnique({
        where: { id: intent.id },
      })
      if (!current || current.status === 'PAID') return

      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: 'PAID',
          tripayReference: payload.reference,
          paidAt: payload.paid_at ? new Date(payload.paid_at * 1000) : new Date(),
        },
      })

      if (current.purpose === 'WALLET_TOPUP') {
        await fulfillWalletTopupInTx(tx, current)
      }
      if (current.purpose === 'KONSULTASI' && current.targetId) {
        const result = await fulfillKonsultasiPaymentInTx(tx, current.targetId)
        if (!result.ok) {
          throw new Error(result.error)
        }
      }
      if (current.purpose === 'MARKETPLACE' && current.targetId) {
        const result = await fulfillMarketplacePaymentInTx(tx, current.targetId)
        if (!result.ok) {
          throw new Error(result.error)
        }
      }
      if (current.purpose === 'CATALOG_TOPUP' && current.targetId) {
        const result = await fulfillCatalogTopupInTx(tx, current.targetId)
        if (!result.ok) {
          throw new Error(result.error)
        }
      }
    })
    return { ok: true as const, message: 'paid' }
  }

  if (mappedStatus === 'EXPIRED' || mappedStatus === 'FAILED' || mappedStatus === 'REFUNDED') {
    if (intent.status === 'UNPAID') {
      await prisma.$transaction(async (tx) => {
        await tx.paymentIntent.update({
          where: { id: intent.id },
          data: { status: mappedStatus, tripayReference: payload.reference },
        })
        if (intent.purpose === 'KONSULTASI' && intent.targetId && mappedStatus === 'EXPIRED') {
          await cancelKonsultasiAwaitingPaymentInTx(tx, intent.targetId)
        }
        if (intent.purpose === 'MARKETPLACE' && intent.targetId && mappedStatus === 'EXPIRED') {
          await cancelMarketplaceAwaitingPaymentInTx(tx, intent.targetId)
        }
        if (intent.purpose === 'CATALOG_TOPUP' && intent.targetId && mappedStatus === 'EXPIRED') {
          await cancelCatalogTopupAwaitingPaymentInTx(tx, intent.targetId)
        }
      })
    }
  }

  return { ok: true as const, message: mappedStatus.toLowerCase() }
}
