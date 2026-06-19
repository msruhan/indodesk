import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  normalizePricingIcon,
  serializePricingFeatures,
  serializePricingPlan,
} from '@/lib/pricing-plans'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  price: z.string().min(1).max(80).optional(),
  priceSubtext: z.string().max(80).optional(),
  cta: z.string().min(1).max(80).optional(),
  ctaHref: z.string().min(1).max(500).optional(),
  highlight: z.boolean().optional(),
  badge: z.string().max(80).nullable().optional(),
  icon: z.enum(['sparkles', 'zap', 'star']).optional(),
  features: z.array(z.string().min(1).max(500)).min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.landingPricingPlan.findUnique({ where: { id } })
    if (!existing) return apiError('Paket pricing tidak ditemukan', 404)

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim()
    if (parsed.data.description !== undefined) data.description = parsed.data.description.trim()
    if (parsed.data.price !== undefined) data.price = parsed.data.price.trim()
    if (parsed.data.priceSubtext !== undefined) {
      data.priceSubtext = parsed.data.priceSubtext.trim()
    }
    if (parsed.data.cta !== undefined) data.cta = parsed.data.cta.trim()
    if (parsed.data.ctaHref !== undefined) data.ctaHref = parsed.data.ctaHref.trim()
    if (parsed.data.highlight !== undefined) data.highlight = parsed.data.highlight
    if (parsed.data.badge !== undefined) {
      data.badge = parsed.data.badge?.trim() || null
    }
    if (parsed.data.icon !== undefined) {
      data.icon = normalizePricingIcon(parsed.data.icon)
    }
    if (parsed.data.features !== undefined) {
      data.features = serializePricingFeatures(parsed.data.features)
    }
    if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive

    const row = await prisma.landingPricingPlan.update({
      where: { id },
      data,
    })
    return apiSuccess(serializePricingPlan(row))
  } catch (e) {
    console.error('[ADMIN_PRICING_PATCH]', e)
    return apiError('Gagal memperbarui paket pricing', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    await prisma.landingPricingPlan.delete({ where: { id } })
    return apiSuccess({ ok: true })
  } catch {
    return apiError('Paket pricing tidak ditemukan', 404)
  }
}
