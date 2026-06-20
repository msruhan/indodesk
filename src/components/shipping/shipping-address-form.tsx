'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { LocationSearchSelect } from '@/components/shipping/location-search-select'
import {
  type StructuredShippingAddress,
  normalizeIndonesianPhone,
} from '@/lib/shipping-address'
import type { ShippingLocationOption } from '@/lib/shipping-locations'
import { provinceIdFromCityId } from '@/lib/shipping-locations'

type ShippingAddressFormProps = {
  value: StructuredShippingAddress
  onChange: (value: StructuredShippingAddress) => void
  fieldErrors?: Partial<Record<keyof StructuredShippingAddress | 'form', string>>
  disabled?: boolean
  /** Sembunyikan field HP (mis. form asal pengiriman toko). */
  showPhone?: boolean
  /** Sembunyikan field jalan. */
  showStreet?: boolean
  streetRequired?: boolean
}

export function ShippingAddressForm({
  value,
  onChange,
  fieldErrors,
  disabled = false,
  showPhone = true,
  showStreet = true,
  streetRequired = true,
}: ShippingAddressFormProps) {
  const [province, setProvince] = useState<ShippingLocationOption | null>(null)

  // Hanya sinkronkan provinsi dari cityId saat edit alamat lama — jangan reset provinsi
  // hanya karena cityId belum dipilih (user sedang memilih provinsi dulu).
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
        // Silent fallback; user can still re-pilih provinsi secara manual.
      }
    })()

    return () => {
      active = false
    }
  }, [province?.id, value.cityId])

  const setProvinceValue = (loc: ShippingLocationOption | null) => {
    setProvince(loc)
    onChange({
      ...value,
      cityId: null,
      cityLabel: null,
      districtId: null,
      districtLabel: null,
      locationId: null,
      locationLabel: null,
    })
  }

  const setCity = (loc: ShippingLocationOption | null) => {
    onChange({
      ...value,
      cityId: loc?.id ?? null,
      cityLabel: loc?.label ?? null,
      districtId: null,
      districtLabel: null,
      locationId: null,
      locationLabel: null,
    })
  }

  const setDistrict = (loc: ShippingLocationOption | null) => {
    onChange({
      ...value,
      districtId: loc?.id ?? null,
      districtLabel: loc?.label ?? null,
      locationId: null,
      locationLabel: null,
    })
  }

  const setVillage = (loc: ShippingLocationOption | null) => {
    onChange({
      ...value,
      locationId: loc?.id ?? null,
      locationLabel: loc?.label ?? null,
    })
  }

  return (
    <div className="space-y-4">
      <LocationSearchSelect
        label="Provinsi"
        placeholder="Pilih provinsi"
        value={province}
        onChange={setProvinceValue}
        searchType="province"
        disabled={disabled}
        required
        prefetch
      />

      <LocationSearchSelect
        label="Kota / Kabupaten"
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
        error={fieldErrors?.cityId ?? null}
      />

      <LocationSearchSelect
        label="Kecamatan"
        placeholder={value.cityId ? 'Pilih kecamatan' : 'Pilih kota dulu'}
        value={
          value.districtId && value.districtLabel
            ? { id: value.districtId, type: 'district', label: value.districtLabel }
            : null
        }
        onChange={setDistrict}
        searchType="district"
        parentId={value.cityId}
        disabled={disabled || !value.cityId}
        required
        error={fieldErrors?.districtId ?? null}
      />

      <LocationSearchSelect
        label="Kelurahan / Desa"
        placeholder={value.districtId ? 'Pilih kelurahan / desa' : 'Pilih kecamatan dulu'}
        value={
          value.locationId && value.locationLabel
            ? { id: value.locationId, type: 'village', label: value.locationLabel }
            : null
        }
        onChange={setVillage}
        searchType="village"
        parentId={value.districtId}
        disabled={disabled || !value.districtId}
        required
        error={fieldErrors?.locationId ?? null}
      />

      {showStreet && (
      <div className="space-y-1">
        <label className="mb-1 block text-sm font-medium text-surface-700">
          Jalan &amp; nomor rumah
          {streetRequired ? <span className="text-rose-600"> *</span> : null}
        </label>
        <Input
          value={value.street}
          disabled={disabled}
          placeholder="Jl. Merdeka No. 12, RT/RW"
          onChange={(e) => onChange({ ...value, street: e.target.value })}
        />
        {fieldErrors?.street && (
          <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.street}</p>
        )}
      </div>
      )}

      {showPhone && (
      <div className="space-y-1">
        <label className="mb-1 block text-sm font-medium text-surface-700">
          No. HP penerima <span className="text-rose-600">*</span>
        </label>
        <Input
          value={value.phone}
          disabled={disabled}
          placeholder="081234567890"
          inputMode="tel"
          onChange={(e) =>
            onChange({ ...value, phone: normalizeIndonesianPhone(e.target.value) })
          }
        />
        {fieldErrors?.phone && (
          <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.phone}</p>
        )}
      </div>
      )}
    </div>
  )
}
