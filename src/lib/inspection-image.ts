import { z } from 'zod'
import { isPlatformHostedImageUrl, isR2PublicUrl } from '@/lib/image-url-utils'

export const INSPECTION_UPLOAD_PREFIX = '/uploads/inspection/'

export const inspectionPhotoUrlSchema = z
  .string()
  .max(2048)
  .refine(
    (v) => {
      if (v.startsWith(INSPECTION_UPLOAD_PREFIX)) return true
      if (v.startsWith('/api/media/private/')) return true
      if (isR2PublicUrl(v)) return true
      try {
        new URL(v)
        return true
      } catch {
        return false
      }
    },
    { message: 'URL foto tidak valid' },
  )

export function isUploadedInspectionPhoto(url: string | null | undefined): boolean {
  if (url?.startsWith('/api/media/private/')) return true
  return isPlatformHostedImageUrl(url, INSPECTION_UPLOAD_PREFIX)
}
