import type { PrismaClient } from '@prisma/client'
import { topupDenominations, topupProducts } from '../src/data/mock-topup'

export async function seedTopupCatalog(prisma: PrismaClient) {
  console.log('  → Topup catalog…')
  let order = 0
  for (const p of topupProducts) {
    order += 1
    const row = await prisma.topupCatalogProduct.create({
      data: {
        slug: p.slug,
        category: p.category,
        name: p.name,
        publisher: p.publisher,
        logo: p.logo,
        cover: p.cover,
        accent: p.accent,
        description: p.description,
        rating: p.rating,
        ratingCount: p.ratingCount,
        ordersToday: p.ordersToday,
        isHot: p.isHot ?? false,
        isActive: true,
        idLabel: p.idLabel,
        serverLabel: p.serverLabel ?? null,
        idHelp: p.idHelp,
        sortOrder: order,
      },
    })

    const denoms = topupDenominations.filter((d) => d.productSlug === p.slug)
    let dOrder = 0
    for (const d of denoms) {
      dOrder += 1
      await prisma.topupDenomination.create({
        data: {
          productId: row.id,
          sku: d.sku,
          group: d.group,
          label: d.label,
          note: d.note ?? null,
          basePrice: d.basePrice,
          salePrice: d.salePrice ?? null,
          badge: d.badge ?? null,
          flashSaleSold: d.flashSale?.sold ?? null,
          flashSaleQuota: d.flashSale?.quota ?? null,
          flashSaleEndsAt: d.flashSale?.endsAt ? new Date(d.flashSale.endsAt) : null,
          isActive: true,
          sortOrder: dOrder,
        },
      })
    }
  }
}
