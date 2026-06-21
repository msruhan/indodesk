'use client'

import { useEffect, useState } from 'react'
import { LocationSearchSelect } from '@/components/shipping/location-search-select'
import type { ShippingLocationOption } from '@/lib/shipping-locations'
import { provinceIdFromCityId } from '@/lib/shipping-locations'

export type WorkCityValue = {
  cityId: string | null
  cityLabel: string | null
}

type WorkCitySelectProps = {
  value: WorkCityValue
  onChange: (value: WorkCityValue) => void
  disabled?: boolean
  provinceLabel?: string
  cityLabel?: string
  cityError?: string | null
}

/** Provinsi + Kota/Kabupaten dari database ShippingLocation (sama dengan checkout). */
export function WorkCitySelect({
  value,
  onChange,
  disabled = false,
  provinceLabel = 'Provinsi',
  cityLabel = 'Kota / Kabupaten',
  cityError,
}: WorkCitySelectProps) {
  const [province, setProvince] = useState<ShippingLocationOption | null>(null)

  useEffect(() => {
    if (!value.cityId) return

    const nextProvinceId = provinceIdFromCityId(value.cityId)
    if (!nextProvinceId) return
    if (province?.id === nextProvinceId) return

    let active = true
    void (async () => {
      try {
        const res = await fetch('/api/shipping/locations?type=province')
        const json = await res.json()
        if (!active || !json.success) return
        const provinces = Array.isArray(json.data?.locations) ? json.data.locations : []
        const matched = provinces.find((row: ShippingLocationOption) => row.id === nextProvinceId)
        if (matched) setProvince(matched)
      } catch {
        // user can re-pick province manually
      }
    })()

    return () => {
      active = false
    }
  }, [province?.id, value.cityId])

  const setProvinceValue = (loc: ShippingLocationOption | null) => {
    setProvince(loc)
    onChange({ cityId: null, cityLabel: null })
  }

  const setCity = (loc: ShippingLocationOption | null) => {
    onChange({
      cityId: loc?.id ?? null,
      cityLabel: loc?.label ?? null,
    })
  }

  return (
    <div className="space-y-4">
      <LocationSearchSelect
        label={provinceLabel}
        placeholder="Pilih provinsi"
        value={province}
        onChange={setProvinceValue}
        searchType="province"
        disabled={disabled}
        required
        prefetch
      />

      <LocationSearchSelect
        label={cityLabel}
        placeholder={province ? 'Pilih kota / kabupaten' : 'Pilih provinsi dulu'}
        value={
          value.cityId && value.cityLabel
            ? { id: value.cityId, type: 'city', label: value.cityLabel }
            : null
        }
        onChange={setCity}
        searchType="city"
        parentId={province?.id}
        disabled={disabled || !province?.id}
        required
        error={cityError ?? null}
      />
    </div>
  )
}
