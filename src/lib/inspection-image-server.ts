import 'server-only'

import { saveImage } from '@/lib/media-storage'
import { INSPECTION_UPLOAD_PREFIX } from '@/lib/inspection-image'

const MAX_BYTES = 5 * 1024 * 1024

export async function saveInspectionPhoto(file: File, userId: string): Promise<string> {
  return saveImage({
    folder: 'inspection',
    localUrlPrefix: INSPECTION_UPLOAD_PREFIX,
    file,
    ownerId: userId,
    maxBytes: MAX_BYTES,
  })
}
