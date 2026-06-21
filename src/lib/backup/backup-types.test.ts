import { describe, expect, it } from 'vitest'
import { formatBackupBytes, parseBackupIndex } from '@/lib/backup/backup-types'

describe('parseBackupIndex', () => {
  it('parses valid index entries', () => {
    const items = parseBackupIndex([
      {
        id: '2026-06-21T03-00-00Z',
        type: 'daily',
        tag: null,
        createdAt: '2026-06-21T03:00:05.000Z',
        databaseSizeBytes: 1000,
        uploadsSizeBytes: 2000,
        status: 'success',
      },
    ])
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('2026-06-21T03-00-00Z')
    expect(items[0]?.type).toBe('daily')
  })

  it('returns empty for invalid payload', () => {
    expect(parseBackupIndex(null)).toEqual([])
    expect(parseBackupIndex({})).toEqual([])
  })
})

describe('formatBackupBytes', () => {
  it('formats sizes', () => {
    expect(formatBackupBytes(500)).toBe('500 B')
    expect(formatBackupBytes(2048)).toBe('2.0 KB')
  })
})
