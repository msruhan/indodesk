import { describe, expect, it } from 'vitest'
import {
  addHours,
  canBuyerInstantCancel,
  canBuyerRequestCancellation,
  canSellerRejectNewOrder,
  canSellerRespondToCancelRequest,
  INSTANT_CANCEL_MS,
  isWithinInstantCancelWindow,
  validateCancelReason,
} from './marketplace-order-cancellation'

describe('validateCancelReason', () => {
  it('rejects short reasons', () => {
    expect(validateCancelReason('too short')).toMatch(/minimal/)
  })

  it('accepts valid reasons', () => {
    expect(validateCancelReason('Salah alamat pengiriman barang')).toBeNull()
  })
})

describe('isWithinInstantCancelWindow', () => {
  it('returns true within one hour of paidAt', () => {
    const paidAt = new Date('2026-06-21T10:00:00.000Z')
    const now = new Date(paidAt.getTime() + 30 * 60 * 1000)
    expect(isWithinInstantCancelWindow(paidAt, now)).toBe(true)
  })

  it('returns false after one hour', () => {
    const paidAt = new Date('2026-06-21T10:00:00.000Z')
    const now = new Date(paidAt.getTime() + INSTANT_CANCEL_MS + 1)
    expect(isWithinInstantCancelWindow(paidAt, now)).toBe(false)
  })
})

describe('canBuyerInstantCancel', () => {
  const paidAt = new Date('2026-06-21T10:00:00.000Z')
  const withinHour = new Date(paidAt.getTime() + 15 * 60 * 1000)

  it('allows PAID within window before processing', () => {
    expect(
      canBuyerInstantCancel(
        { status: 'PAID', paidAt, processingAt: null },
        false,
        withinHour,
      ),
    ).toBe(true)
  })

  it('denies when processing started', () => {
    expect(
      canBuyerInstantCancel(
        { status: 'PAID', paidAt, processingAt: withinHour },
        false,
        withinHour,
      ),
    ).toBe(false)
  })

  it('denies with pending cancel request', () => {
    expect(
      canBuyerInstantCancel(
        { status: 'PAID', paidAt, processingAt: null },
        true,
        withinHour,
      ),
    ).toBe(false)
  })
})

describe('canBuyerRequestCancellation', () => {
  const paidAt = new Date('2026-06-21T10:00:00.000Z')
  const afterHour = new Date(paidAt.getTime() + INSTANT_CANCEL_MS + 60_000)

  it('allows after instant window on PAID', () => {
    expect(
      canBuyerRequestCancellation(
        { status: 'PAID', paidAt, processingAt: null },
        false,
        afterHour,
      ),
    ).toBe(true)
  })

  it('allows on PROCESSING', () => {
    expect(
      canBuyerRequestCancellation(
        { status: 'PROCESSING', paidAt, processingAt: afterHour },
        false,
        afterHour,
      ),
    ).toBe(true)
  })

  it('denies with pending request', () => {
    expect(
      canBuyerRequestCancellation(
        { status: 'PROCESSING', paidAt, processingAt: afterHour },
        true,
        afterHour,
      ),
    ).toBe(false)
  })
})

describe('canSellerRejectNewOrder', () => {
  it('allows PAID without processingAt', () => {
    expect(canSellerRejectNewOrder({ status: 'PAID', processingAt: null })).toBe(true)
  })

  it('denies after processing started', () => {
    expect(
      canSellerRejectNewOrder({ status: 'PAID', processingAt: new Date() }),
    ).toBe(false)
  })
})

describe('canSellerRespondToCancelRequest', () => {
  it('allows pending request before deadline', () => {
    const deadline = addHours(new Date(), 24)
    expect(
      canSellerRespondToCancelRequest(
        { status: 'PENDING', sellerDeadline: deadline },
        new Date(),
      ),
    ).toBe(true)
  })

  it('denies expired deadline', () => {
    expect(
      canSellerRespondToCancelRequest(
        { status: 'PENDING', sellerDeadline: new Date(Date.now() - 1000) },
        new Date(),
      ),
    ).toBe(false)
  })
})
