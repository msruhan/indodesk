import 'server-only'

import { deleteImage, saveImage } from '@/lib/media-storage'

const LOCAL_PREFIX = '/uploads/products/'
const MAX_BYTES = 5 * 1024 * 1024

export async function saveProductImage(file: File, sellerId: string): Promise<string> {
  return saveImage({
    folder: 'products',
    localUrlPrefix: LOCAL_PREFIX,
    file,
    ownerId: sellerId,
    maxBytes: MAX_BYTES,
  })
}

export async function deleteProductImage(imageUrl: string | null | undefined): Promise<void> {
  await deleteImage(imageUrl, LOCAL_PREFIX)
}
