import 'server-only'

import { deleteImage, saveImage } from '@/lib/media-storage'
import { PORTFOLIO_UPLOAD_PREFIX } from '@/lib/portfolio-image'

const MAX_BYTES = 5 * 1024 * 1024

export async function savePortfolioImage(file: File, userId: string): Promise<string> {
  return saveImage({
    folder: 'teknisi-portfolio',
    localUrlPrefix: PORTFOLIO_UPLOAD_PREFIX,
    file,
    ownerId: userId,
    maxBytes: MAX_BYTES,
  })
}

export async function deletePortfolioImage(imageUrl: string | null | undefined): Promise<void> {
  await deleteImage(imageUrl, PORTFOLIO_UPLOAD_PREFIX)
}
