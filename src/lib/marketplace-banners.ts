/** Halaman tempat banner promo ditampilkan. */
export type BannerPlacement = 'marketplace' | 'shop' | 'topup'

export type MarketplaceBanner = {
  id: string
  title: string
  subtitle: string
  image: string
  link: string
  buttonText: string
  active: boolean
  sortOrder: number
  placement: BannerPlacement
}

export const BANNER_PLACEMENT_OPTIONS: {
  value: BannerPlacement
  label: string
  path: string
}[] = [
  { value: 'marketplace', label: 'Marketplace', path: '/marketplace' },
  { value: 'shop', label: 'Shop', path: '/shop' },
  { value: 'topup', label: 'Top Up', path: '/topup' },
]

/** Opsi penempatan banner di form admin (marketplace & shop). */
export const ADMIN_BANNER_PLACEMENT_OPTIONS = BANNER_PLACEMENT_OPTIONS.filter(
  (o) => o.value === 'marketplace' || o.value === 'shop',
)

export function placementPath(placement: BannerPlacement): string {
  return BANNER_PLACEMENT_OPTIONS.find((o) => o.value === placement)?.path ?? '/marketplace'
}

export function normalizeBannerPlacement(banner: MarketplaceBanner): MarketplaceBanner {
  const legacy = banner as MarketplaceBanner & { placement?: BannerPlacement }
  const placement = legacy.placement ?? 'marketplace'
  return {
    ...banner,
    placement,
    link: placementPath(placement),
  }
}

export function placementLabel(placement: BannerPlacement): string {
  return BANNER_PLACEMENT_OPTIONS.find((o) => o.value === placement)?.label ?? placement
}
