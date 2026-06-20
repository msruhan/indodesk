import { describe, expect, it } from 'vitest'
import { computeMarketplaceFees } from './marketplace-fees'

const baseSettings = {
  buyerFeePercent: 2,
  buyerFlatFeePerItem: 0,
  sellerFeePercent: 2.5,
}

describe('computeMarketplaceFees', () => {
  it('calculates percent-only buyer fee', () => {
    const result = computeMarketplaceFees(100_000, baseSettings, 1)
    expect(result.buyerFeePercentPart).toBe(2_000)
    expect(result.buyerFlatFeePart).toBe(0)
    expect(result.buyerFee).toBe(2_000)
    expect(result.buyerHold).toBe(102_000)
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

  it('combines percent and flat buyer fees', () => {
    const result = computeMarketplaceFees(
      1_000_000,
      { ...baseSettings, buyerFeePercent: 1.5, buyerFlatFeePerItem: 2_000 },
      2,
    )
    expect(result.buyerFeePercentPart).toBe(15_000)
    expect(result.buyerFlatFeePart).toBe(4_000)
    expect(result.buyerFee).toBe(19_000)
    expect(result.sellerFee).toBe(25_000)
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
