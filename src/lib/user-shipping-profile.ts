import {
  formatStructuredShippingAddress,
  validateStructuredShippingAddress,
  type StructuredShippingAddress,
} from '@/lib/shipping-address'

export type UserShippingProfileSource = {
  phone?: string | null
  address?: string | null
  shippingCityId?: string | null
  shippingCityLabel?: string | null
  shippingDistrictId?: string | null
  shippingDistrictLabel?: string | null
  shippingLocationId?: string | null
  shippingLocationLabel?: string | null
  shippingStreet?: string | null
}

export function profileToShippingAddress(
  data: UserShippingProfileSource,
): StructuredShippingAddress {
  return {
    cityId: data.shippingCityId ?? null,
    cityLabel: data.shippingCityLabel ?? null,
    districtId: data.shippingDistrictId ?? null,
    districtLabel: data.shippingDistrictLabel ?? null,
    locationId: data.shippingLocationId ?? null,
    locationLabel: data.shippingLocationLabel ?? null,
    street: data.shippingStreet?.trim() || data.address?.trim() || '',
    phone: data.phone?.trim() || '',
  }
}

export function hasCompleteSavedShippingAddress(addr: StructuredShippingAddress): boolean {
  return validateStructuredShippingAddress(addr) === null
}

export function shippingAddressToProfilePayload(addr: StructuredShippingAddress) {
  return {
    phone: addr.phone,
    address: formatStructuredShippingAddress(addr),
    shippingCityId: addr.cityId,
    shippingCityLabel: addr.cityLabel,
    shippingDistrictId: addr.districtId,
    shippingDistrictLabel: addr.districtLabel,
    shippingLocationId: addr.locationId,
    shippingLocationLabel: addr.locationLabel,
    shippingStreet: addr.street.trim(),
  }
}
