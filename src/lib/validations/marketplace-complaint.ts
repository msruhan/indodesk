import { z } from 'zod'

export const marketplaceComplaintReasonSchema = z
  .string()
  .trim()
  .min(20, 'Alasan komplain minimal 20 karakter')
  .max(2000)

export const marketplaceComplaintSellerResponseSchema = z
  .string()
  .trim()
  .min(10, 'Respons minimal 10 karakter')
  .max(2000)

export const marketplaceComplaintResolveSchema = z.object({
  resolution: z.enum(['REFUND_FULL', 'REFUND_PARTIAL', 'REJECTED']),
  refundAmount: z.number().positive().optional(),
  adminNote: z.string().max(2000).optional(),
})

export const MARKETPLACE_COMPLAINT_PHOTO_MAX = 5 * 1024 * 1024
export const MARKETPLACE_COMPLAINT_VIDEO_MAX = 50 * 1024 * 1024
export const MARKETPLACE_COMPLAINT_PHOTO_MIN = 1
export const MARKETPLACE_COMPLAINT_VIDEO_MIN = 1
