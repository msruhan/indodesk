import type { LandingPricingPlan } from '@prisma/client'

export const LANDING_PRICING_META_KEY = 'landing_pricing_meta'

export type PricingPlanIcon = 'sparkles' | 'zap' | 'star'

export type LandingPricingMeta = {
  badge: string
  title: string
  titleHighlight: string
  subtitle: string
}

export type PricingPlanDto = {
  id: string
  name: string
  description: string
  price: string
  priceSubtext: string
  cta: string
  ctaHref: string
  highlight: boolean
  badge: string | null
  icon: PricingPlanIcon
  features: string[]
  sortOrder: number
  isActive: boolean
}

export type LandingPricingSection = {
  meta: LandingPricingMeta
  plans: PricingPlanDto[]
}

export const DEFAULT_LANDING_PRICING_META: LandingPricingMeta = {
  badge: 'Pricing',
  title: 'Paket pricing yang',
  titleHighlight: ' transparan',
  subtitle: 'Mulai gratis dan upgrade sesuai kebutuhan. Tanpa biaya tersembunyi.',
}

export const DEFAULT_PRICING_PLANS: Omit<PricingPlanDto, 'id'>[] = [
  {
    name: 'Buyer',
    description: 'Untuk pembeli yang ingin berbelanja produk dan layanan',
    price: 'Gratis',
    priceSubtext: 'Selamanya',
    cta: 'Mulai berbelanja',
    ctaHref: '/register',
    highlight: false,
    badge: null,
    icon: 'sparkles',
    features: [
      'Browse marketplace produk',
      'Konsultasi dengan teknisi',
      'Remote assistance',
      'Rekber (escrow) aman',
      'Inspection service',
      'Topup pulsa & data',
      'Chat real-time',
      'Wallet & saldo',
    ],
    sortOrder: 0,
    isActive: true,
  },
  {
    name: 'Teknisi Free',
    description: 'Untuk teknisi yang baru mulai tanpa komitmen finansial',
    price: 'Rp 0',
    priceSubtext: 'per bulan',
    cta: 'Daftar sebagai teknisi',
    ctaHref: '/register',
    highlight: false,
    badge: null,
    icon: 'zap',
    features: [
      'Profil teknisi publik',
      'Toko handphone dasar',
      'Maks 5 produk aktif',
      'Terima konsultasi (15% komisi)',
      'Terima remote service (15% komisi)',
      'Marketplace seller (3-5% komisi)',
      'Analytics dasar',
      'Chat dengan user',
      'Wallet & earning',
    ],
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Teknisi Pro',
    description: 'Untuk teknisi serius yang ingin scale bisnis dengan fitur premium',
    price: 'Rp 49.000',
    priceSubtext: 'per bulan',
    cta: 'Upgrade ke Pro',
    ctaHref: '/register',
    highlight: true,
    badge: 'Paling populer',
    icon: 'star',
    features: [
      'Semua fitur Teknisi Free +',
      'Badge verified (setelah KYC)',
      'Featured placement di listing',
      'Unlimited produk aktif',
      'Toko premium (cover, gallery, journey)',
      'Komisi lebih kecil (8% konsultasi & remote)',
      'Komisi marketplace (1-2%)',
      'Analytics detail & export laporan',
      'Inspection service eligible',
      'Priority support',
      'Featured product placement',
    ],
    sortOrder: 2,
    isActive: true,
  },
]

const ICON_VALUES: PricingPlanIcon[] = ['sparkles', 'zap', 'star']

export function parsePricingFeatures(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  } catch {
    return []
  }
}

export function serializePricingFeatures(features: string[]): string {
  return JSON.stringify(features.map((f) => f.trim()).filter(Boolean))
}

export function normalizePricingIcon(value: string): PricingPlanIcon {
  return ICON_VALUES.includes(value as PricingPlanIcon) ? (value as PricingPlanIcon) : 'sparkles'
}

export function serializePricingPlan(row: LandingPricingPlan): PricingPlanDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    priceSubtext: row.priceSubtext,
    cta: row.cta,
    ctaHref: row.ctaHref,
    highlight: row.highlight,
    badge: row.badge,
    icon: normalizePricingIcon(row.icon),
    features: parsePricingFeatures(row.features),
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }
}

export function parseLandingPricingMeta(raw: string | null | undefined): LandingPricingMeta {
  if (!raw) return { ...DEFAULT_LANDING_PRICING_META }
  try {
    const parsed = JSON.parse(raw) as Partial<LandingPricingMeta>
    return {
      badge: parsed.badge?.trim() || DEFAULT_LANDING_PRICING_META.badge,
      title: parsed.title?.trim() || DEFAULT_LANDING_PRICING_META.title,
      titleHighlight:
        parsed.titleHighlight?.trim() ?? DEFAULT_LANDING_PRICING_META.titleHighlight,
      subtitle: parsed.subtitle?.trim() || DEFAULT_LANDING_PRICING_META.subtitle,
    }
  } catch {
    return { ...DEFAULT_LANDING_PRICING_META }
  }
}

export function serializeLandingPricingMeta(meta: LandingPricingMeta): string {
  return JSON.stringify({
    badge: meta.badge.trim(),
    title: meta.title.trim(),
    titleHighlight: meta.titleHighlight,
    subtitle: meta.subtitle.trim(),
  })
}

export const PRICING_ICON_OPTIONS: { value: PricingPlanIcon; label: string }[] = [
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'zap', label: 'Zap' },
  { value: 'star', label: 'Star' },
]
