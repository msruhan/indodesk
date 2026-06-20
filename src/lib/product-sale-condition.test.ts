import { describe, expect, it } from 'vitest'
import {
  newProductBenchmarkDbValues,
  shouldSkipUsedProductBenchmarkInput,
} from '@/lib/product-sale-condition'

describe('product-sale-condition', () => {
  it('skips benchmark input for new iPhone', () => {
    expect(shouldSkipUsedProductBenchmarkInput('NEW', 'IPHONE')).toBe(true)
    expect(shouldSkipUsedProductBenchmarkInput('USED', 'IPHONE')).toBe(false)
    expect(shouldSkipUsedProductBenchmarkInput('NEW', 'AKSESORIS')).toBe(false)
  })

  it('sets perfect benchmark values for new iPhone', () => {
    const values = newProductBenchmarkDbValues('IPHONE')
    expect(values.saleCondition).toBe('NEW')
    expect(values.conditionGrade).toBe('BNIB')
    expect(values.conditionPercent).toBe(100)
    expect(values.batteryHealth).toBe(100)
    expect(values.verified3uTools).toBe(false)
  })
})
