import type { MarketplaceBanner as PrismaBanner } from '@prisma/client'
import type { MarketplaceBanner } from '@/lib/marketplace-banners'
import { normalizeBannerPlacement, placementPath, type BannerPlacement } from '@/lib/marketplace-banners'

export function serializeBanner(row: PrismaBanner): MarketplaceBanner {
  const placement = (row.placement || 'marketplace') as BannerPlacement
  return normalizeBannerPlacement({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: row.image,
    link: row.link || placementPath(placement),
    buttonText: row.buttonText,
    active: row.active,
    sortOrder: row.sortOrder,
    placement,
  })
}

export type BannerCreateInput = {
  title: string
  subtitle?: string
  image: string
  buttonText?: string
  active?: boolean
  placement: BannerPlacement
}

export function bannerCreateData(input: BannerCreateInput) {
  return {
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() ?? '',
    image: input.image.trim(),
    link: placementPath(input.placement),
    buttonText: input.buttonText?.trim() || 'Lihat',
    active: input.active ?? true,
    placement: input.placement,
  }
}
