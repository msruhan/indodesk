import { prisma } from '@/lib/db'
import {
  DEFAULT_LANDING_PRICING_META,
  DEFAULT_PRICING_PLANS,
  LANDING_PRICING_META_KEY,
  parseLandingPricingMeta,
  serializeLandingPricingMeta,
  serializePricingFeatures,
  serializePricingPlan,
  type LandingPricingMeta,
  type LandingPricingSection,
  type PricingPlanDto,
} from '@/lib/pricing-plans'

export async function getLandingPricingMeta(): Promise<LandingPricingMeta> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: LANDING_PRICING_META_KEY },
  })
  return parseLandingPricingMeta(row?.value)
}

export async function saveLandingPricingMeta(meta: LandingPricingMeta): Promise<LandingPricingMeta> {
  const value = serializeLandingPricingMeta(meta)
  await prisma.platformSetting.upsert({
    where: { key: LANDING_PRICING_META_KEY },
    create: { key: LANDING_PRICING_META_KEY, value },
    update: { value },
  })
  return parseLandingPricingMeta(value)
}

async function seedDefaultPricingPlansIfEmpty(): Promise<void> {
  const count = await prisma.landingPricingPlan.count()
  if (count > 0) return

  await prisma.landingPricingPlan.createMany({
    data: DEFAULT_PRICING_PLANS.map((plan) => ({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      priceSubtext: plan.priceSubtext,
      cta: plan.cta,
      ctaHref: plan.ctaHref,
      highlight: plan.highlight,
      badge: plan.badge,
      icon: plan.icon,
      features: serializePricingFeatures(plan.features),
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    })),
  })
}

export async function listAllPricingPlans(): Promise<PricingPlanDto[]> {
  await seedDefaultPricingPlansIfEmpty()
  const rows = await prisma.landingPricingPlan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
  return rows.map(serializePricingPlan)
}

export async function listActivePricingPlans(): Promise<PricingPlanDto[]> {
  await seedDefaultPricingPlansIfEmpty()
  const rows = await prisma.landingPricingPlan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map(serializePricingPlan)
}

export async function getLandingPricingSection(): Promise<LandingPricingSection> {
  const [meta, plans] = await Promise.all([
    getLandingPricingMeta(),
    listActivePricingPlans(),
  ])
  return { meta, plans }
}

export async function getLandingPricingSectionWithFallback(): Promise<LandingPricingSection> {
  try {
    return await getLandingPricingSection()
  } catch {
    return {
      meta: { ...DEFAULT_LANDING_PRICING_META },
      plans: DEFAULT_PRICING_PLANS.map((plan, index) => ({
        ...plan,
        id: `fallback-${index}`,
      })),
    }
  }
}
