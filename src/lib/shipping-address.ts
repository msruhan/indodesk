import type { BinderbyteLocation, BinderbyteLocationType } from '@/lib/binderbyte-shipping'

export type StructuredShippingAddress = {
  cityId: string | null
  cityLabel: string | null
  districtId: string | null
  districtLabel: string | null
  locationId: string | null
  locationLabel: string | null
  street: string
  phone: string
}

export const EMPTY_STRUCTURED_SHIPPING_ADDRESS: StructuredShippingAddress = {
  cityId: null,
  cityLabel: null,
  districtId: null,
  districtLabel: null,
  locationId: null,
  locationLabel: null,
  street: '',
  phone: '',
}

export function filterLocationsByType(
  locations: BinderbyteLocation[],
  type: BinderbyteLocationType,
): BinderbyteLocation[] {
  return locations.filter((loc) => loc.type === type)
}

/** Filter child locations by BinderByte hierarchical ID prefix. */
export function filterLocationsByParentPrefix(
  locations: BinderbyteLocation[],
  parentId: string,
  childType: BinderbyteLocationType,
): BinderbyteLocation[] {
  const prefix = parentPrefixForChild(parentId, childType)
  if (!prefix) return filterLocationsByType(locations, childType)
  return locations.filter((loc) => loc.type === childType && loc.id.startsWith(prefix))
}

function parentPrefixForChild(parentId: string, childType: BinderbyteLocationType): string | null {
  if (childType === 'district' && parentId.startsWith('city_')) {
    return `district_${parentId.slice('city_'.length)}.`
  }
  if (childType === 'village' && parentId.startsWith('district_')) {
    return `village_${parentId.slice('district_'.length)}.`
  }
  return null
}

export function formatStructuredShippingAddress(addr: StructuredShippingAddress): string {
  const parts = [
    addr.street.trim(),
    addr.locationLabel?.trim(),
    addr.districtLabel?.trim(),
    addr.cityLabel?.trim(),
  ].filter(Boolean)
  return parts.join(', ')
}

const PHONE_RE = /^(\+62|62|0)[0-9]{8,13}$/

export function normalizeIndonesianPhone(raw: string): string {
  return raw.trim().replace(/[\s-]/g, '')
}

export function isValidIndonesianPhone(raw: string): boolean {
  const normalized = normalizeIndonesianPhone(raw)
  return PHONE_RE.test(normalized)
}

export function validateStructuredShippingAddress(
  addr: StructuredShippingAddress,
): string | null {
  if (!addr.cityId || !addr.cityLabel) return 'Kota/Kabupaten wajib dipilih'
  if (!addr.districtId || !addr.districtLabel) return 'Kecamatan wajib dipilih'
  if (!addr.locationId || !addr.locationLabel) return 'Kelurahan/Desa wajib dipilih'
  if (addr.street.trim().length < 5) return 'Alamat jalan wajib diisi (minimal 5 karakter)'
  const phone = normalizeIndonesianPhone(addr.phone)
  if (!phone) return 'Nomor HP wajib diisi'
  if (!isValidIndonesianPhone(phone)) return 'Format nomor HP tidak valid (contoh: 08123456789)'
  return null
}

/** Validasi lokasi asal pengiriman toko (tanpa HP). */
export function validateShipOriginLocation(
  addr: Pick<
    StructuredShippingAddress,
    'cityId' | 'cityLabel' | 'districtId' | 'districtLabel' | 'locationId' | 'locationLabel'
  >,
): string | null {
  if (!addr.cityId || !addr.cityLabel) return 'Kota/Kabupaten asal pengiriman wajib dipilih'
  if (!addr.districtId || !addr.districtLabel) return 'Kecamatan asal pengiriman wajib dipilih'
  if (!addr.locationId || !addr.locationLabel) return 'Kelurahan/Desa asal pengiriman wajib dipilih'
  return null
}

export function shippingOptionKey(courier: string, service: string): string {
  return `${courier}:${service}`
}

export function parseShippingOptionKey(key: string): { courier: string; service: string } | null {
  const idx = key.indexOf(':')
  if (idx <= 0) return null
  return { courier: key.slice(0, idx), service: key.slice(idx + 1) }
}
