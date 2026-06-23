import { describe, expect, it } from 'vitest'
import { splitProfileTextParagraphs } from '@/lib/format-profile-text'

describe('splitProfileTextParagraphs', () => {
  it('respects blank lines between paragraphs', () => {
    expect(splitProfileTextParagraphs('Paragraf satu.\n\nParagraf dua.')).toEqual([
      'Paragraf satu.',
      'Paragraf dua.',
    ])
  })

  it('splits long walls without punctuation at word boundaries', () => {
    const long =
      'Assalamu alaikum wr wb keluarga dan sahabat semua Saya Rahma Ashari dari Beji Tulis Batang Jawa tengah Salam semangat sehat semua Pengalaman saya di teknisi cukup lama walau tdk terlalu fokus pada satu atau dua device Akan tetapi untuk kerusakan ringan dan menengah dari semua device hp laptop kamera PC android iphone windows InsyaAllah saya masih bisa menanganinya'
    const parts = splitProfileTextParagraphs(long)
    expect(parts.length).toBeGreaterThan(1)
    expect(parts.join(' ')).toBe(long)
  })

  it('groups multiple sentences into readable paragraphs', () => {
    const parts = splitProfileTextParagraphs(
      'Saya biasa memflash ulang iPhone. Saya juga backup data antar perangkat. Alasan saya daftar agar bisa melayani lebih banyak pelanggan.',
    )
    expect(parts.length).toBeGreaterThanOrEqual(1)
    expect(parts.join(' ')).toContain('memflash')
  })
})
