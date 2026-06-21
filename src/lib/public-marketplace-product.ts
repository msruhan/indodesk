import type { Prisma } from '@prisma/client'

/** Produk yang boleh tampil di marketplace publik (listing, detail, toko). */
export const PUBLIC_MARKETPLACE_PRODUCT_WHERE: Prisma.ProductWhereInput = {
  isActive: true,
  isPublished: true,
  listingStatus: 'APPROVED',
  stock: { gt: 0 },
}
