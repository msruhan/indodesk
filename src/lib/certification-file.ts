import { isPlatformHostedImageUrl, isR2PublicUrl } from '@/lib/image-url-utils'

export const CERTIFICATION_UPLOAD_PREFIX = '/uploads/teknisi-certifications/'

export function isUploadedCertificationFile(fileUrl: string | null | undefined): boolean {
  if (!fileUrl) return false
  if (fileUrl.startsWith(CERTIFICATION_UPLOAD_PREFIX)) return true
  if (fileUrl.startsWith('/api/media/private/')) return true
  return isR2PublicUrl(fileUrl)
}
