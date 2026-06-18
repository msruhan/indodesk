import { describe, expect, it } from 'vitest'
import { getDualControlThreshold, requiresDualControl } from '@/lib/wallet/dual-control'

describe('dual-control threshold', () => {
  it('requires dual control above threshold', () => {
    process.env.WALLET_DUAL_CONTROL_THRESHOLD = '5000000'
    expect(requiresDualControl(5_000_001)).toBe(true)
    expect(requiresDualControl(5_000_000)).toBe(false)
    expect(getDualControlThreshold()).toBe(5_000_000)
  })
})
