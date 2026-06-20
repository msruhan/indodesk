import { describe, expect, it } from 'vitest'
import {
  hasCompleteSavedShippingAddress,
  profileToShippingAddress,
  shippingAddressToProfilePayload,
} from '@/lib/user-shipping-profile'

describe('user-shipping-profile', () => {
  it('maps profile fields to structured address', () => {
    const addr = profileToShippingAddress({
      phone: '081234567890',
      shippingCityId: 'city_36.72',
      shippingCityLabel: 'Cilegon',
      shippingDistrictId: 'district_36.72.08',
      shippingDistrictLabel: 'Citangkil',
      shippingLocationId: 'village_36.72.08.1007',
      shippingLocationLabel: 'Citangkil',
      shippingStreet: 'Jl. Merdeka 12',
    })

    expect(addr.phone).toBe('081234567890')
    expect(addr.street).toBe('Jl. Merdeka 12')
    expect(hasCompleteSavedShippingAddress(addr)).toBe(true)
  })

  it('builds profile payload from structured address', () => {
    const payload = shippingAddressToProfilePayload({
      cityId: 'city_36.72',
      cityLabel: 'Cilegon',
      districtId: 'district_36.72.08',
      districtLabel: 'Citangkil',
      locationId: 'village_36.72.08.1007',
      locationLabel: 'Citangkil',
      street: 'Jl. Merdeka 12',
      phone: '081234567890',
    })

    expect(payload.shippingLocationId).toBe('village_36.72.08.1007')
    expect(payload.address).toContain('Jl. Merdeka 12')
  })
})
