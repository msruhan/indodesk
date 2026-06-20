import { describe, expect, it } from 'vitest'
import { calculateServicePlatformFees } from './service-platform-fees'

describe('calculateServicePlatformFees', () => {
  it('splits price between platform and teknisi', () => {
    const result = calculateServicePlatformFees(100_000, 10)
    expect(result.platformFee).toBe(10_000)
    expect(result.teknisiEarning).toBe(90_000)
  })

  it('uses floor for platform fee', () => {
    const result = calculateServicePlatformFees(10_000, 10)
    expect(result.platformFee).toBe(1_000)
    expect(result.teknisiEarning).toBe(9_000)
  })

  it('returns zero platform fee when percent is 0', () => {
    const result = calculateServicePlatformFees(50_000, 0)
    expect(result.platformFee).toBe(0)
    expect(result.teknisiEarning).toBe(50_000)
  })
})
