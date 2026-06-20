import { describe, expect, it } from 'vitest'
import {
  resolveTelegramProductPhotoUrl,
  resolveTelegramProductPhotoUrls,
  toTelegramAccessibleImageUrl,
} from '@/lib/telegram/product-photo-url'

describe('toTelegramAccessibleImageUrl', () => {
  it('returns HTTPS URLs as-is', () => {
    const url = 'https://pub-abc.r2.dev/products/photo.jpg'
    expect(toTelegramAccessibleImageUrl(url, 'https://bantoo.in')).toBe(url)
  })

  it('resolves relative paths against app base', () => {
    expect(toTelegramAccessibleImageUrl('/uploads/x.jpg', 'https://bantoo.in')).toBe(
      'https://bantoo.in/uploads/x.jpg',
    )
  })
})

describe('resolveTelegramProductPhotoUrls', () => {
  it('returns all images with primary first', () => {
    const urls = resolveTelegramProductPhotoUrls(
      {
        image: null,
        images: [
          { url: 'https://cdn.example/a.jpg', isPrimary: false },
          { url: 'https://cdn.example/main.jpg', isPrimary: true },
          { url: 'https://cdn.example/c.jpg', isPrimary: false },
        ],
      },
      'https://bantoo.in',
    )
    expect(urls).toEqual([
      'https://cdn.example/main.jpg',
      'https://cdn.example/a.jpg',
      'https://cdn.example/c.jpg',
    ])
  })

  it('deduplicates identical URLs', () => {
    const urls = resolveTelegramProductPhotoUrls(
      {
        images: [
          { url: 'https://cdn.example/same.jpg', isPrimary: true },
          { url: 'https://cdn.example/same.jpg', isPrimary: false },
        ],
      },
      'https://bantoo.in',
    )
    expect(urls).toHaveLength(1)
  })
})

describe('resolveTelegramProductPhotoUrl', () => {
  it('uses primary image from images array', () => {
    const url = resolveTelegramProductPhotoUrl(
      {
        image: null,
        images: [
          { url: 'https://cdn.example/a.jpg', isPrimary: false },
          { url: 'https://cdn.example/main.jpg', isPrimary: true },
        ],
      },
      'https://bantoo.in',
    )
    expect(url).toBe('https://cdn.example/main.jpg')
  })

  it('falls back to legacy image field', () => {
    expect(
      resolveTelegramProductPhotoUrl(
        { image: 'https://cdn.example/legacy.jpg', images: [] },
        'https://bantoo.in',
      ),
    ).toBe('https://cdn.example/legacy.jpg')
  })

  it('returns null when no image', () => {
    expect(resolveTelegramProductPhotoUrl({ image: null, images: [] }, 'https://bantoo.in')).toBeNull()
  })
})
