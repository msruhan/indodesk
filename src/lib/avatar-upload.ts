import 'server-only'

import { deleteImage, saveImage } from '@/lib/media-storage'

const LOCAL_PREFIX = '/uploads/avatars/'
const MAX_BYTES = 2 * 1024 * 1024

export async function saveAvatarFile(file: File, userId: string): Promise<string> {
  return saveImage({
    folder: 'avatars',
    localUrlPrefix: LOCAL_PREFIX,
    file,
    ownerId: userId,
    maxBytes: MAX_BYTES,
  })
}

export async function deleteAvatarFile(imageUrl: string | null | undefined): Promise<void> {
  await deleteImage(imageUrl, LOCAL_PREFIX)
}
