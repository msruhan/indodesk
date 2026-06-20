import { describe, expect, it } from 'vitest'
import {
  filterLocationsByParentPrefix,
  formatStructuredShippingAddress,
  isValidIndonesianPhone,
  validateStructuredShippingAddress,
} from '@/lib/shipping-address'

describe('shipping-address', () => {
  it('validates required structured fields', () => {
    expect(
      validateStructuredShippingAddress({
        cityId: 'city_36.72',
        cityLabel: 'Cilegon',
        districtId: 'district_36.72.08',
        districtLabel: 'Citangkil',
        locationId: 'village_36.72.08.1007',
        locationLabel: 'Citangkil',
        street: 'Jl. Merdeka 12',
        phone: '081234567890',
      }),
    ).toBeNull()
  })

  it('filters districts under city prefix', () => {
    const rows = filterLocationsByParentPrefix(
      [
        { id: 'district_36.72.08', type: 'district', label: 'Citangkil' },
        { id: 'district_31.71.01', type: 'district', label: 'Other' },
      ],
      'city_36.72',
      'district',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('district_36.72.08')
  })

  it('formats full address string', () => {
    expect(
      formatStructuredShippingAddress({
        cityId: 'city_36.72',
        cityLabel: 'Cilegon',
        districtId: 'district_36.72.08',
        districtLabel: 'Citangkil',
        locationId: 'village_36.72.08.1007',
        locationLabel: 'Citangkil Desa',
        street: 'Jl. ABC 1',
        phone: '08123',
      }),
    ).toContain('Jl. ABC 1')
  })

  it('validates Indonesian phone', () => {
    expect(isValidIndonesianPhone('081234567890')).toBe(true)
    expect(isValidIndonesianPhone('123')).toBe(false)
  })
})
