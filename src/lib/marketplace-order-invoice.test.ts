import { describe, expect, it } from 'vitest'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import { buildMarketplaceOrderInvoice } from './marketplace-order-invoice'

const baseOrder: MarketplaceOrderDto = {
  id: 'order-1',
  orderCode: 'ORD-2026-VH34SV',
  buyerId: 'buyer-1',
  buyerName: 'Rehan',
  buyerEmail: 'rehan@example.com',
  buyerImage: null,
  sellerId: 'seller-1',
  sellerName: 'Ahmad Hidayat',
  sellerImage: null,
  items: [
    {
      productId: 'p1',
      name: 'Charger iPhone 20W USB-C Original',
      quantity: 1,
      price: 18_000,
      lineTotal: 18_000,
    },
  ],
  subtotal: 18_000,
  discount: 0,
  fee: 1_000,
  buyerHoldAmount: 31_000,
  buyerFeePercentPart: 0,
  buyerFlatFeePart: 1_000,
  buyerFlatFeePerItem: 1_000,
  total: 18_000,
  status: 'awaiting_payment',
  statusLabel: 'Menunggu pembayaran',
  note: null,
  createdAt: '2026-06-21T00:49:00.000Z',
  dateLabel: 'Hari ini',
  role: 'buyer',
  canAdvanceStatus: false,
  canCancelOrder: false,
  canCancelAwaitingPayment: true,
  canCancelInstant: false,
  canRequestCancellation: false,
  canWithdrawCancelRequest: false,
  canRejectNewOrder: false,
  canRespondToCancelRequest: false,
  paidAt: null,
  cancellationRequest: null,
  nextStatus: null,
  requiresShipmentInput: false,
  awaitingBuyerConfirmation: false,
  tracking: null,
  shippingAddress: 'Jalan Haji Ali RT 1 RW 8 Depok',
  shippingPhone: '085773161147',
  shippingCost: 12_000,
  checkoutShippingCourier: 'jnt',
  checkoutShippingCourierLabel: 'J&T Express',
  checkoutShippingCourierEnum: 'JNT',
  checkoutShippingService: 'REG',
  deliveredAt: null,
  buyerActionDeadline: null,
  autoCompletedAt: null,
  completedAt: null,
  canConfirmReceipt: false,
  canFileComplaint: false,
  canEscalateComplaint: false,
  canRespondToComplaint: false,
  canSubmitReturn: false,
  canConfirmReturn: false,
  canRejectReturn: false,
  complaint: null,
  canReview: false,
  reviewedProductIds: [],
  packagingProof: null,
  requiresPackagingProof: false,
  canSubmitPackagingProof: false,
  canDownloadShippingLabel: false,
}

describe('buildMarketplaceOrderInvoice', () => {
  it('builds summary lines with shipping and service fee', () => {
    const invoice = buildMarketplaceOrderInvoice(baseOrder)
    expect(invoice.invoiceNumber).toBe('ORD-2026-VH34SV')
    expect(invoice.paymentStatus).toBe('unpaid')
    expect(invoice.paymentStatusLabel).toBe('MENUNGGU PEMBAYARAN')
    expect(invoice.paymentMethodLabel).toBe('Belum dibayar')
    expect(invoice.totalBill).toBe(31_000)
    expect(invoice.summaryLines.some((l) => l.label === 'Total tagihan')).toBe(true)
  })

  it('marks paid orders as LUNAS', () => {
    const invoice = buildMarketplaceOrderInvoice(
      { ...baseOrder, status: 'paid', statusLabel: 'Dibayar' },
      { paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'tripay' },
    )
    expect(invoice.paymentStatus).toBe('paid')
    expect(invoice.paymentStatusLabel).toBe('LUNAS')
    expect(invoice.paymentMethodLabel).toBe('Payment Gateway (Tripay)')
  })
})
