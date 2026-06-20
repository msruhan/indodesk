import { prisma } from '@/lib/db'

export type TeknisiShipOrigin = {
  originId: string | null
  originLabel: string | null
  cityLabel: string | null
  street: string | null
}

/** "BANDUNG, JAWA BARAT" → "Bandung" untuk tampilan publik. */
export function formatShipOriginCityDisplay(cityLabel: string | null | undefined): string | null {
  if (!cityLabel?.trim()) return null
  const cityPart = cityLabel.split(',')[0]?.trim() || cityLabel.trim()
  return cityPart
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/** Alamat asal pengiriman teknisi — profil dulu, fallback toko (data lama). */
export async function loadTeknisiShipOrigin(userId: string): Promise<TeknisiShipOrigin> {
  const profile = await prisma.teknisiProfile.findUnique({
    where: { userId },
    select: {
      shipOriginLocationId: true,
      shipOriginLocationLabel: true,
      shipOriginCityLabel: true,
      shipOriginStreet: true,
    },
  })

  if (profile?.shipOriginLocationId) {
    return {
      originId: profile.shipOriginLocationId,
      originLabel: profile.shipOriginLocationLabel,
      cityLabel: profile.shipOriginCityLabel,
      street: profile.shipOriginStreet,
    }
  }

  const store = await prisma.teknisiStore.findUnique({
    where: { userId },
    select: {
      shipOriginLocationId: true,
      shipOriginLocationLabel: true,
      shipOriginCityLabel: true,
      shipOriginStreet: true,
    },
  })

  return {
    originId: store?.shipOriginLocationId ?? null,
    originLabel: store?.shipOriginLocationLabel ?? null,
    cityLabel: store?.shipOriginCityLabel ?? null,
    street: store?.shipOriginStreet ?? null,
  }
}
