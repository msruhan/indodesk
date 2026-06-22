import { describe, expect, it } from 'vitest'
import { isAllowedVideoUrl, parseVideoEmbedUrl } from '@/lib/video-embed-url'

describe('parseVideoEmbedUrl', () => {
  it('parses YouTube watch URLs', () => {
    const result = parseVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result?.platform).toBe('youtube')
    expect(result?.embedUrl).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('parses Vimeo URLs', () => {
    const result = parseVideoEmbedUrl('https://vimeo.com/123456789')
    expect(result?.platform).toBe('vimeo')
    expect(result?.embedUrl).toBe('https://player.vimeo.com/video/123456789')
  })

  it('rejects unsupported hosts', () => {
    expect(parseVideoEmbedUrl('https://example.com/video')).toBeNull()
    expect(isAllowedVideoUrl('https://example.com/video')).toBe(false)
  })
})
