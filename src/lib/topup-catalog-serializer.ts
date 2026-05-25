import type { TopupCatalogProduct, TopupDenomination } from '@prisma/client'
import type { TopupDenomination as TopupDenominationDto, TopupProduct } from '@/data/topup-types'

type ProductWithDenoms = TopupCatalogProduct & {
  denominations: TopupDenomination[]
}

export function serializeTopupDenomination(d: TopupDenomination): TopupDenominationDto {
  const flashSale =
    d.flashSaleQuota != null && d.flashSaleEndsAt
      ? {
          sold: d.flashSaleSold ?? 0,
          quota: d.flashSaleQuota,
          endsAt: d.flashSaleEndsAt.toISOString(),
        }
      : undefined

  return {
    sku: d.sku,
    productSlug: '', // filled by parent
    group: d.group,
    label: d.label,
    note: d.note ?? undefined,
    basePrice: Number(d.basePrice),
    salePrice: d.salePrice != null ? Number(d.salePrice) : undefined,
    badge: d.badge ?? undefined,
    flashSale,
  }
}

export function serializeTopupProduct(p: ProductWithDenoms): TopupProduct {
  return {
    slug: p.slug,
    category: p.category as TopupProduct['category'],
    name: p.name,
    publisher: p.publisher,
    logo: p.logo,
    cover: p.cover,
    accent: p.accent,
    description: p.description,
    rating: Number(p.rating),
    ratingCount: p.ratingCount,
    ordersToday: p.ordersToday,
    isHot: p.isHot,
    idLabel: p.idLabel,
    serverLabel: p.serverLabel ?? undefined,
    idHelp: p.idHelp,
  }
}

export function serializeTopupCatalog(products: ProductWithDenoms[]) {
  const serializedProducts = products.map(serializeTopupProduct)
  const denominations = products.flatMap((p) =>
    p.denominations
      .filter((d) => d.isActive)
      .map((d) => ({
        ...serializeTopupDenomination(d),
        productSlug: p.slug,
      })),
  )
  return { products: serializedProducts, denominations }
}

export type AdminTopupProductDto = TopupProduct & {
  id: string
  isActive: boolean
  sortOrder: number
  denominationCount: number
}

export function serializeAdminTopupProduct(p: ProductWithDenoms): AdminTopupProductDto {
  return {
    ...serializeTopupProduct(p),
    id: p.id,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    denominationCount: p.denominations.length,
  }
}
