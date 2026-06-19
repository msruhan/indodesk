import { prisma } from '@/lib/db'
import {
  deriveRekberSellerType,
  type RekberSellerPreview,
} from '@/lib/rekber-seller-types'

export type { RekberSellerPreview } from '@/lib/rekber-seller-types'

const ACTIVE_PRODUCT_WHERE = {
  isActive: true,
  isPublished: true,
  listingStatus: 'APPROVED' as const,
}

export async function getRekberSellerPreview(args: {
  sellerId?: string
  sellerEmail?: string
}): Promise<RekberSellerPreview | null> {
  const sellerId = args.sellerId?.trim()
  const sellerEmail = args.sellerEmail?.trim().toLowerCase()

  if (!sellerId && !sellerEmail) return null

  const seller = await prisma.user.findFirst({
    where: sellerId ? { id: sellerId } : { email: sellerEmail },
    select: { id: true, name: true, role: true },
  })
  if (!seller) return null

  const [count, listings] = await Promise.all([
    prisma.product.count({
      where: { sellerId: seller.id, ...ACTIVE_PRODUCT_WHERE },
    }),
    prisma.product.findMany({
      where: { sellerId: seller.id, ...ACTIVE_PRODUCT_WHERE },
      select: { id: true, name: true, price: true },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
  ])

  return {
    sellerId: seller.id,
    sellerName: seller.name ?? 'Penjual',
    sellerType: deriveRekberSellerType(seller.role),
    activeListingCount: count,
    listings: listings.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
    })),
  }
}
