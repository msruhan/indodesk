import { describe, expect, it } from 'vitest'
import {
  resolveTelegramProductPhotoUrl,
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
