import { z } from 'zod'
import { inspectionPhotoUrlSchema } from '@/lib/inspection-image'

const checklistItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  result: z.enum(['pass', 'fail', 'unknown']),
  note: z.string().max(500).optional(),
})

export const createInspectionSchema = z
  .object({
    teknisiId: z.string().min(1),
    mode: z.enum(['ONLINE', 'OFFLINE']),
    category: z.enum(['HANDPHONE', 'LAPTOP']),
    productId: z.string().optional(),
    productName: z.string().min(2).max(200),
    productSource: z.enum([
      'INDOTEKNIZII',
      'TOKOPEDIA',
      'SHOPEE',
      'OLX',
      'FACEBOOK_MARKETPLACE',
      'PRIVATE',
      'OTHER',
    ]),
    productSourceUrl: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
    location: z.string().max(300).optional(),
    city: z.string().max(120).optional(),
    scheduledAt: z.string().datetime().optional(),
  })
  .refine(
    (data) => data.mode !== 'OFFLINE' || (data.location?.trim().length ?? 0) >= 3,
    { message: 'Lokasi wajib untuk inspeksi offline', path: ['location'] },
  )
  .refine(
    (data) => {
      const url = data.productSourceUrl?.trim()
      if (!url) return true
      if (url.startsWith('/')) return true
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    },
    { message: 'URL sumber produk tidak valid', path: ['productSourceUrl'] },
  )

export const submitInspectionReportSchema = z.object({
  overallCondition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  recommendation: z.enum(['RECOMMENDED', 'NEGOTIATE', 'NOT_RECOMMENDED']),
  checklist: z.array(checklistItemSchema).min(1),
  findings: z.string().min(10).max(5000),
  suggestions: z.string().max(2000).optional(),
  photoUrls: z.array(inspectionPhotoUrlSchema).max(20).optional().default([]),
})

export const rateInspectionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
})

export const disputeInspectionSchema = z.object({
  reason: z.string().min(10).max(1000),
})
