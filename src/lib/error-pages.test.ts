import { describe, expect, it } from 'vitest'
import { classifyError } from '@/lib/error-pages'

describe('classifyError', () => {
  it('detects provider/context crashes', () => {
    const content = classifyError(
      new Error('useWallet must be used within WalletProvider'),
    )
    expect(content.kind).toBe('client-crash')
  })

  it('detects chunk load failures after deploy', () => {
    const content = classifyError(new Error('Loading chunk 123 failed'))
    expect(content.kind).toBe('chunk-load')
  })

  it('detects network errors', () => {
    const content = classifyError(new Error('Failed to fetch'))
    expect(content.kind).toBe('network')
  })

  it('falls back to unknown for unclassified errors', () => {
    const content = classifyError(new Error('Something odd happened'))
    expect(content.kind).toBe('unknown')
  })
})
