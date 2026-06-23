import { describe, expect, it } from 'vitest'
import { computeConfirmDeadline, KONSULTASI_CONFIRM_TIMEOUT_HOURS } from './konsultasi-completion'

describe('computeConfirmDeadline', () => {
  it('adds 24 hours', () => {
    const from = new Date('2026-06-20T10:00:00Z')
    const deadline = computeConfirmDeadline(from)
    expect(deadline.getTime() - from.getTime()).toBe(
      KONSULTASI_CONFIRM_TIMEOUT_HOURS * 3_600_000,
    )
  })
})
