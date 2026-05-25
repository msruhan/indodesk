import 'server-only'

import { deleteImage, saveImage } from '@/lib/media-storage'

const LOCAL_PREFIX = '/uploads/teknisi-covers/'
const MAX_BYTES = 5 * 1024 * 1024

export async function saveProfileCover(file: File, userId: string): Promise<string> {
  return saveImage({
    folder: 'teknisi-covers',
    localUrlPrefix: LOCAL_PREFIX,
    file,
    ownerId: userId,
    maxBytes: MAX_BYTES,
  })
}

export async function deleteProfileCover(imageUrl: string | null | undefined): Promise<void> {
  await deleteImage(imageUrl, LOCAL_PREFIX)
}
