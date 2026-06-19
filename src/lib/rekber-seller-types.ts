import type { UserRole } from '@prisma/client'

export type RekberSellerType = 'teknisi' | 'member'

export type RekberSellerListingPreview = {
  id: string
  name: string
  price: number
}

export type RekberSellerPreview = {
  sellerId: string
  sellerName: string
  sellerType: RekberSellerType
  activeListingCount: number
  listings: RekberSellerListingPreview[]
}

export function deriveRekberSellerType(role: UserRole): RekberSellerType {
  return role === 'TEKNISI' ? 'teknisi' : 'member'
}

export function rekberSellerTypeLabel(type: RekberSellerType): string {
  return type === 'teknisi' ? 'Teknisi' : 'Member'
}

export type RekberSellerOption = {
  id: string
  name: string
  email: string
  sellerType: RekberSellerType
  sellerTypeLabel: string
  subtitle: string | null
}
