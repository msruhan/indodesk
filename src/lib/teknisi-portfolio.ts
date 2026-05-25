import type { TeknisiPortfolioCase } from '@prisma/client'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Laptop, Smartphone, Wrench } from '@/lib/icons'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'

export type TeknisiPortfolioIcon = 'smartphone' | 'wrench' | 'laptop'

export type TeknisiPortfolioItemDto = {
  id: string
  title: string
  meta: string
  result: string
  imageUrl: string | null
  icon: TeknisiPortfolioIcon
  tone: string
  glow: string
}

const ICON_MAP: Record<TeknisiPortfolioIcon, PhosphorIcon> = {
  smartphone: Smartphone,
  wrench: Wrench,
  laptop: Laptop,
}

export function resolvePortfolioIcon(icon: string): PhosphorIcon {
  if (icon in ICON_MAP) return ICON_MAP[icon as TeknisiPortfolioIcon]
  return Smartphone
}

export function serializeTeknisiPortfolioCase(row: TeknisiPortfolioCase): TeknisiPortfolioItemDto {
  const icon = (['smartphone', 'wrench', 'laptop'].includes(row.icon)
    ? row.icon
    : 'smartphone') as TeknisiPortfolioIcon

  return {
    id: row.id,
    title: row.title,
    meta: row.meta,
    result: row.result,
    imageUrl: resolveDisplayImageUrl(row.imageUrl),
    icon,
    tone: row.tone,
    glow: row.glow,
  }
}
