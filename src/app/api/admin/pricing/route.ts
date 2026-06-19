import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  getLandingPricingMeta,
  listAllPricingPlans,
  saveLandingPricingMeta,
} from '@/lib/pricing-plans-server'
import {
  normalizePricingIcon,
  serializePricingFeatures,
  serializePricingPlan,
} from '@/lib/pricing-plans'

export const dynamic = 'force-dynamic'

const metaSchema = z.object({
  badge: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  titleHighlight: z.string().max(120),
  subtitle: z.string().min(1).max(500),
})

const planSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  price: z.string().min(1).max(80),
  priceSubtext: z.string().max(80).optional(),
  cta: z.string().min(1).max(80),
  ctaHref: z.string().min(1).max(500),
  highlight: z.boolean().optional(),
  badge: z.string().max(80).nullable().optional(),
  icon: z.enum(['sparkles', 'zap', 'star']).optional(),
  features: z.array(z.string().min(1).max(500)).min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const [meta, plans] = await Promise.all([getLandingPricingMeta(), listAllPricingPlans()])
    return apiSuccess({ meta, plans })
  } catch (e) {
    console.error('[ADMIN_PRICING_GET]', e)
    return apiError('Gagal memuat pricing', 500)
  }
}

export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()

    if (body?.type === 'meta') {
      const parsed = metaSchema.safeParse(body.meta)
      if (!parsed.success) {
        return apiError(parsed.error.issues[0]?.message ?? 'Data header tidak valid')
      }
      const meta = await saveLandingPricingMeta(parsed.data)
      return apiSuccess({ meta })
    }

    const parsed = planSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data paket tidak valid')
    }

    const maxOrder = await prisma.landingPricingPlan.aggregate({
      _max: { sortOrder: true },
    })
    const sortOrder = parsed.data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1

    const row = await prisma.landingPricingPlan.create({
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() ?? '',
        price: parsed.data.price.trim(),
        priceSubtext: parsed.data.priceSubtext?.trim() ?? '',
        cta: parsed.data.cta.trim(),
        ctaHref: parsed.data.ctaHref.trim(),
        highlight: parsed.data.highlight ?? false,
        badge: parsed.data.badge?.trim() || null,
        icon: normalizePricingIcon(parsed.data.icon ?? 'sparkles'),
        features: serializePricingFeatures(parsed.data.features),
        sortOrder,
        isActive: parsed.data.isActive ?? true,
      },
    })

    return apiSuccess(serializePricingPlan(row), 201)
  } catch (e) {
    console.error('[ADMIN_PRICING_POST]', e)
    return apiError('Gagal menyimpan pricing', 500)
  }
}

export async function PUT(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = metaSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data header tidak valid')
    }
    const meta = await saveLandingPricingMeta(parsed.data)
    return apiSuccess({ meta })
  } catch (e) {
    console.error('[ADMIN_PRICING_META_PUT]', e)
    return apiError('Gagal menyimpan header pricing', 500)
  }
}
