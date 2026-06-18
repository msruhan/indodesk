import { describe, expect, it } from 'vitest'
import { MagicByteError, validateUpload } from '@/lib/uploads/validate'

/** Minimal valid JPEG (SOI + EOI). */
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xd9])

/** PNG signature + IHDR chunk stub. */
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x3a, 0x7e, 0x9b,
  0x55, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x5c, 0xc2, 0x5d, 0x8e, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
])

describe('validateUpload (magic-byte)', () => {
  it('accepts JPEG from buffer regardless of client MIME', async () => {
    const result = await validateUpload(JPEG_BYTES, 1024 * 1024)
    expect(result.mime).toBe('image/jpeg')
  })

  it('accepts PNG from buffer', async () => {
    const result = await validateUpload(PNG_BYTES, 1024 * 1024)
    expect(result.mime).toBe('image/png')
  })

  it('rejects executable disguised as image', async () => {
    const fake = Buffer.from('%PDF-1.4 fake')
    await expect(validateUpload(fake, 1024 * 1024)).rejects.toThrow(MagicByteError)
  })

  it('rejects empty file', async () => {
    await expect(validateUpload(Buffer.alloc(0), 1024)).rejects.toThrow(MagicByteError)
  })
})
