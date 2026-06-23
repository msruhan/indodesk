import { describe, expect, it } from 'vitest'
import {
  buildIndodeskHeartbeatStatus,
  buildIndodeskSessionPreflight,
  isIndodeskRemoteOtpVisible,
} from '@/lib/indodesk-session-policy'

describe('isIndodeskRemoteOtpVisible', () => {
  it('shows OTP for ACTIVE and AWAITING_CONFIRMATION', () => {
    expect(isIndodeskRemoteOtpVisible('ACTIVE', true)).toBe(true)
    expect(isIndodeskRemoteOtpVisible('AWAITING_CONFIRMATION', true)).toBe(true)
  })

  it('hides OTP for COMPLETED and when remote not required', () => {
    expect(isIndodeskRemoteOtpVisible('COMPLETED', true)).toBe(false)
    expect(isIndodeskRemoteOtpVisible('ACTIVE', false)).toBe(false)
  })
})

describe('buildIndodeskSessionPreflight', () => {
  it('returns canUnlock when session has remoteOtp', () => {
    const result = buildIndodeskSessionPreflight({
      id: 's1',
      status: 'ACTIVE',
      remoteId: '123456789',
      remoteOtp: '654321',
      confirmDeadlineAt: null,
    })
    expect(result.canUnlock).toBe(true)
    expect(result.sessionId).toBe('s1')
  })

  it('returns locked when no session', () => {
    const result = buildIndodeskSessionPreflight(null)
    expect(result.canUnlock).toBe(false)
    expect(result.reason).toContain('Tidak ada sesi')
  })
})

describe('buildIndodeskHeartbeatStatus', () => {
  it('shouldLogout when no eligible session', () => {
    expect(buildIndodeskHeartbeatStatus(null).shouldLogout).toBe(true)
  })

  it('sessionActive when OTP present', () => {
    const result = buildIndodeskHeartbeatStatus({
      id: 's1',
      status: 'AWAITING_CONFIRMATION',
      remoteOtp: '111111',
    })
    expect(result.sessionActive).toBe(true)
    expect(result.shouldLogout).toBe(false)
  })
})
