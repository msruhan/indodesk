import { z } from 'zod'
import type { ShippingCourier } from '@prisma/client'
import { SHIPPING_COURIER_OPTIONS } from '@/lib/shipping-courier'

const courierValues = SHIPPING_COURIER_OPTIONS.map((o) => o.value) as [
  ShippingCourier,
  ...ShippingCourier[],
]

export const marketplaceComplaintReturnSchema = z.object({
  courier: z.enum(courierValues),
  trackingNumber: z
    .string()
    .trim()
    .min(6, 'Nomor resi minimal 6 karakter')
    .max(64, 'Nomor resi terlalu panjang'),
})

export const marketplaceComplaintReturnRejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(20, 'Alasan penolakan minimal 20 karakter')
    .max(2000),
})

export const MARKETPLACE_RETURN_PHOTO_MIN = 1
export const MARKETPLACE_RETURN_VIDEO_MIN = 1
export const MARKETPLACE_RETURN_REJECT_PHOTO_MIN = 1
