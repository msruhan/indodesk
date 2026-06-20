import { prisma } from '@/lib/db'
import { resolveSellerShippingCouriers } from '@/lib/shipping-config'

export async function loadTeknisiShippingCouriers(userId: string): Promise<string[]> {
  const profile = await prisma.teknisiProfile.findUnique({
    where: { userId },
    select: { shipOriginCouriers: true },
  })
  return resolveSellerShippingCouriers(profile?.shipOriginCouriers)
}

export async function loadTeknisiShippingCouriersBySeller(
  sellerIds: string[],
): Promise<Map<string, string[]>> {
  const unique = [...new Set(sellerIds.filter(Boolean))]
  if (unique.length === 0) return new Map()

  const profiles = await prisma.teknisiProfile.findMany({
    where: { userId: { in: unique } },
    select: { userId: true, shipOriginCouriers: true },
  })

  const map = new Map<string, string[]>()
  for (const id of unique) {
    map.set(id, resolveSellerShippingCouriers([]))
  }
  for (const p of profiles) {
    map.set(p.userId, resolveSellerShippingCouriers(p.shipOriginCouriers))
  }
  return map
}
