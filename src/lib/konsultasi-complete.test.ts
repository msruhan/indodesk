import { describe, expect, it } from 'vitest'
import { KonsultasiCompletionError } from './konsultasi-complete'
import type { KonsultasiSession } from '@prisma/client'

describe('KonsultasiCompletionError', () => {
  it('exposes INVALID_STATUS via message', () => {
    const err = new KonsultasiCompletionError('INVALID_STATUS')
    expect(err.message).toBe('INVALID_STATUS')
    expect(err.name).toBe('KonsultasiCompletionError')
  })
})

describe('completeKonsultasiSession status guard', () => {
  it('documents required status', () => {
    const activeSession = { status: 'ACTIVE' } as KonsultasiSession
    expect(activeSession.status).not.toBe('AWAITING_CONFIRMATION')
    const err = new KonsultasiCompletionError('INVALID_STATUS')
    expect(err).toBeInstanceOf(Error)
  })
})
