import { ShippingLocationType } from '@prisma/client'

export type ShippingLocationOption = {
  id: string
  type: 'province' | 'city' | 'district' | 'village'
  label: string
}

export const SHIPPING_LOCATION_TYPE_MAP = {
  province: ShippingLocationType.PROVINCE,
  city: ShippingLocationType.CITY,
  district: ShippingLocationType.DISTRICT,
  village: ShippingLocationType.VILLAGE,
} as const

export function provinceIdFromCityId(cityId: string | null | undefined): string | null {
  if (!cityId?.startsWith('city_')) return null
  const code = cityId.slice('city_'.length)
  const provinceCode = code.split('.')[0]
  if (!provinceCode) return null
  return `province_${provinceCode}`
}

export function buildBinderbyteCityId(code: string): string {
  return `city_${code}`
}

export function buildBinderbyteDistrictId(code: string): string {
  return `district_${code}`
}

export function buildBinderbyteVillageId(code: string): string {
  return `village_${code}`
}

export function sortShippingLocations<T extends { name?: string; nama?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    (a.name ?? a.nama ?? '').localeCompare(b.name ?? b.nama ?? '', 'id'),
  )
}
