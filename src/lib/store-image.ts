import 'server-only'

import { deleteImage, saveImage } from '@/lib/media-storage'

const LOCAL_PREFIX = '/uploads/stores/'
const MAX_BYTES = 5 * 1024 * 1024

export async function saveStoreCover(file: File, userId: string): Promise<string> {
  return saveImage({
    folder: 'stores',
    localUrlPrefix: LOCAL_PREFIX,
    file,
    ownerId: userId,
    maxBytes: MAX_BYTES,
  })
}

export async function deleteStoreCover(imageUrl: string | null | undefined): Promise<void> {
  await deleteImage(imageUrl, LOCAL_PREFIX)
}

export async function saveStoreGalleryImage(file: File, userId: string): Promise<string> {
  return saveImage({
    folder: 'stores',
    localUrlPrefix: LOCAL_PREFIX,
    file,
    ownerId: userId,
    maxBytes: MAX_BYTES,
  })
}

export async function deleteStoreGalleryImage(imageUrl: string | null | undefined): Promise<void> {
  await deleteImage(imageUrl, LOCAL_PREFIX)
}
