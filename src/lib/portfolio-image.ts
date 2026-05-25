import { z } from 'zod'
import { isPlatformHostedImageUrl, isR2PublicUrl } from '@/lib/image-url-utils'

export const PORTFOLIO_UPLOAD_PREFIX = '/uploads/teknisi-portfolio/'

export const portfolioImageUrlSchema = z
  .string()
  .max(2048)
  .optional()
  .nullable()
  .refine(
    (v) => {
      if (v == null || v === '') return true
      if (v.startsWith(PORTFOLIO_UPLOAD_PREFIX)) return true
      if (isR2PublicUrl(v)) return true
      try {
        new URL(v)
        return true
      } catch {
        return false
      }
    },
    { message: 'URL gambar tidak valid' },
  )

export function isUploadedPortfolioImage(imageUrl: string | null | undefined): boolean {
  return isPlatformHostedImageUrl(imageUrl, PORTFOLIO_UPLOAD_PREFIX)
}

export function portfolioImageMode(imageUrl: string): 'url' | 'file' {
  return isUploadedPortfolioImage(imageUrl) ? 'file' : 'url'
}
