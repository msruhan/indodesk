import type { InspectionDeviceCategory, InspectionMode } from '@prisma/client'

const PLATFORM_FEE_RATE = 0.2

const DEFAULT_PRICES: Record<InspectionMode, Record<InspectionDeviceCategory, number>> = {
  ONLINE: {
    HANDPHONE: 75_000,
    LAPTOP: 100_000,
  },
  OFFLINE: {
    HANDPHONE: 200_000,
    LAPTOP: 300_000,
  },
}

export function getInspectionBasePrice(
  mode: InspectionMode,
  category: InspectionDeviceCategory,
): number {
  return DEFAULT_PRICES[mode][category]
}

export function calculateInspectionFees(price: number) {
  const platformFee = Math.round(price * PLATFORM_FEE_RATE)
  const teknisiEarning = price - platformFee
  return { price, platformFee, teknisiEarning }
}

export function generateInspectionOrderCode(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `INS-${y}${m}${day}-${rand}`
}

export function generateCertificateNumber(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CERT-${Date.now().toString(36).toUpperCase()}-${rand}`
}
