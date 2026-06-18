import 'server-only'

import { deleteStoreGalleryImage, saveStoreGalleryImage } from '@/lib/store-image'
import { MAX_STORE_GALLERY_IMAGES } from '@/lib/store-gallery'

type GalleryOrderItem = { kind: 'url'; url: string } | { kind: 'file' }

export async function resolveStoreGalleryFromForm(
  form: FormData,
  userId: string,
  existingGallery: string[] = [],
): Promise<string[]> {
  const orderRaw = form.get('galleryOrder')
  const files = form
    .getAll('gallery')
    .filter((f): f is File => f instanceof File && f.size > 0)

  let order: GalleryOrderItem[] = []
  if (typeof orderRaw === 'string' && orderRaw.trim()) {
    try {
      const parsed = JSON.parse(orderRaw) as unknown
      if (Array.isArray(parsed)) {
        order = parsed.filter((item): item is GalleryOrderItem => {
          if (!item || typeof item !== 'object') return false
          const kind = (item as GalleryOrderItem).kind
          if (kind === 'file') return true
          if (kind === 'url' && typeof (item as { url?: string }).url === 'string') return true
          return false
        })
      }
    } catch {
      order = []
    }
  }

  if (order.length === 0) {
    order = [
      ...existingGallery.map((url) => ({ kind: 'url' as const, url })),
      ...files.map(() => ({ kind: 'file' as const })),
    ]
  }

  const merged: string[] = []
  let fileIdx = 0

  for (const item of order) {
    if (merged.length >= MAX_STORE_GALLERY_IMAGES) break
    if (item.kind === 'url') {
      merged.push(item.url)
    } else {
      const file = files[fileIdx++]
      if (!file) continue
      merged.push(await saveStoreGalleryImage(file, userId))
    }
  }

  return merged
}

export async function deleteRemovedStoreGalleryImages(
  before: string[],
  after: string[],
): Promise<void> {
  const afterSet = new Set(after)
  for (const url of before) {
    if (!afterSet.has(url)) {
      await deleteStoreGalleryImage(url)
    }
  }
}

export async function deleteAllStoreGalleryImages(gallery: string[]): Promise<void> {
  for (const url of gallery) {
    await deleteStoreGalleryImage(url)
  }
}

export function galleryChanged(before: string[], after: string[]): boolean {
  return JSON.stringify(before) !== JSON.stringify(after)
}
