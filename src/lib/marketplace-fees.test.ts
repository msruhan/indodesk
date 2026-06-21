import { describe, expect, it } from 'vitest'
import {
  computeMarketplaceFees,
  resolveSellerFeePercentForItemPrice,
  validateSellerFeeTiers,
} from './marketplace-fees'

const baseSettings = {
  buyerFeePercent: 2,
  buyerFlatFeePerItem: 0,
  sellerFeePercent: 2.5,
  sellerFeeTiers: [],
}

describe('computeMarketplaceFees', () => {
  it('calculates percent-only buyer fee', () => {
    const result = computeMarketplaceFees(100_000, baseSettings, 1)
    expect(result.buyerFeePercentPart).toBe(2_000)
    expect(result.buyerFlatFeePart).toBe(0)
    expect(result.buyerFee).toBe(2_000)
    expect(result.buyerHold).toBe(102_000)
    expect(result.sellerFeePercentApplied).toBe(2.5)
    expect(result.sellerFee).toBe(2_500)
  })

  it('calculates flat fee per item quantity', () => {
    const result = computeMarketplaceFees(
      100_000,
      { ...baseSettings, buyerFeePercent: 0, buyerFlatFeePerItem: 1_500 },
      3,
    )
    expect(result.buyerFlatFeePart).toBe(4_500)
    expect(result.buyerFee).toBe(4_500)
    expect(result.buyerHold).toBe(104_500)
  })

  it('calculates seller fee per item for flat rate', () => {
    const result = computeMarketplaceFees(1_000_000, baseSettings, 2)
    expect(result.sellerFee).toBe(25_000)
  })

  it('calculates seller fee per line when prices differ', () => {
    const result = computeMarketplaceFees(
      600_000,
      { ...baseSettings, sellerFeePercent: 10 },
      2,
      [
        { unitPrice: 100_000, quantity: 1 },
        { unitPrice: 500_000, quantity: 1 },
      ],
    )
    expect(result.sellerFee).toBe(60_000)
  })

  it('disables buyer fees when settings are zero', () => {
    const result = computeMarketplaceFees(
      50_000,
      { ...baseSettings, buyerFeePercent: 0, buyerFlatFeePerItem: 0 },
      5,
    )
    expect(result.buyerFee).toBe(0)
    expect(result.buyerHold).toBe(50_000)
  })
})

describe('resolveSellerFeePercentForItemPrice', () => {
  const tieredSettings = {
    sellerFeePercent: 4,
    sellerFeeTiers: [
      { minAmount: 0, maxAmount: 100_000, feePercent: 1 },
      { minAmount: 100_000, maxAmount: 1_000_000, feePercent: 2 },
    ],
  }

  it('uses flat percent when no tiers configured', () => {
    expect(resolveSellerFeePercentForItemPrice(500_000, baseSettings)).toBe(2.5)
  })

  it('applies lower range for cheap items', () => {
    expect(resolveSellerFeePercentForItemPrice(50_000, tieredSettings)).toBe(1)
  })

  it('applies higher range at shared boundary', () => {
    expect(resolveSellerFeePercentForItemPrice(100_000, tieredSettings)).toBe(2)
    expect(resolveSellerFeePercentForItemPrice(500_000, tieredSettings)).toBe(2)
  })

  it('calculates seller fee from tier ranges per item', () => {
    const low = computeMarketplaceFees(50_000, { ...baseSettings, ...tieredSettings }, 1)
    const mid = computeMarketplaceFees(500_000, { ...baseSettings, ...tieredSettings }, 1)
    expect(low.sellerFee).toBe(500)
    expect(mid.sellerFee).toBe(10_000)
  })
})

describe('validateSellerFeeTiers', () => {
  it('requires first range to start at zero', () => {
    expect(
      validateSellerFeeTiers([{ minAmount: 100_000, maxAmount: 200_000, feePercent: 2 }]),
    ).toMatch(/Rentang pertama/)
  })

  it('rejects max below min', () => {
    expect(
      validateSellerFeeTiers([
        { minAmount: 0, maxAmount: 100_000, feePercent: 1 },
        { minAmount: 50_000, maxAmount: 10_000, feePercent: 2 },
      ]),
    ).toMatch(/maksimum/)
  })

  it('allows unlimited max only on last tier', () => {
    expect(
      validateSellerFeeTiers([
        { minAmount: 0, maxAmount: 100_000, feePercent: 1 },
        { minAmount: 100_000, maxAmount: null, feePercent: 2 },
      ]),
    ).toBeNull()
  })
})
