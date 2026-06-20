'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DashboardPanel } from '@/components/dashboard'
import { ShippingAddressForm } from '@/components/shipping/shipping-address-form'
import { TeknisiShippingCourierPicker } from '@/components/shipping/teknisi-shipping-courier-picker'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'
import {
  validateShipOriginLocation,
  type StructuredShippingAddress,
} from '@/lib/shipping-address'
import { validateShipOriginCouriers } from '@/lib/shipping-config'

function profileToShippingForm(p: TeknisiAccountProfileDto) {
  return {
    shipOrigin: {
      cityId: p.shipOriginCityId ?? null,
      cityLabel: p.shipOriginCityLabel ?? null,
      districtId: p.shipOriginDistrictId ?? null,
      districtLabel: p.shipOriginDistrictLabel ?? null,
      locationId: p.shipOriginLocationId ?? null,
      locationLabel: p.shipOriginLocationLabel ?? null,
      street: p.shipOriginStreet ?? '',
      phone: p.phone ?? '',
    } satisfies StructuredShippingAddress,
    shipOriginCouriers: [...(p.shipOriginCouriers ?? [])],
  }
}

function hasPartialShipOrigin(addr: StructuredShippingAddress): boolean {
  return Boolean(
    addr.cityId ||
      addr.cityLabel ||
      addr.districtId ||
      addr.districtLabel ||
      addr.locationId ||
      addr.locationLabel ||
      addr.street.trim(),
  )
}

export function TeknisiProductShippingSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shipOrigin, setShipOrigin] = useState<StructuredShippingAddress>({
    cityId: null,
    cityLabel: null,
    districtId: null,
    districtLabel: null,
    locationId: null,
    locationLabel: null,
    street: '',
    phone: '',
  })
  const [shipOriginCouriers, setShipOriginCouriers] = useState<string[]>([])

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teknisi/profile')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat pengaturan pengiriman')
        return
      }
      const form = profileToShippingForm(json.data as TeknisiAccountProfileDto)
      setShipOrigin(form.shipOrigin)
      setShipOriginCouriers(form.shipOriginCouriers)
    } catch {
      setError('Gagal memuat pengaturan pengiriman')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const shipOriginFilled = hasPartialShipOrigin(shipOrigin)
    if (shipOriginFilled) {
      const originErr = validateShipOriginLocation(shipOrigin)
      if (originErr) {
        setError(originErr)
        setMessage(null)
        return
      }
      const courierErr = validateShipOriginCouriers(shipOriginCouriers, {
        requireAtLeastOne: true,
      })
      if (courierErr) {
        setError(courierErr)
        setMessage(null)
        return
      }
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const payload = shipOriginFilled
        ? {
            shipOriginCityId: shipOrigin.cityId,
            shipOriginCityLabel: shipOrigin.cityLabel,
            shipOriginDistrictId: shipOrigin.districtId,
            shipOriginDistrictLabel: shipOrigin.districtLabel,
            shipOriginLocationId: shipOrigin.locationId,
            shipOriginLocationLabel: shipOrigin.locationLabel,
            shipOriginStreet: shipOrigin.street.trim() || null,
            shipOriginCouriers,
          }
        : {
            shipOriginCityId: null,
            shipOriginCityLabel: null,
            shipOriginDistrictId: null,
            shipOriginDistrictLabel: null,
            shipOriginLocationId: null,
            shipOriginLocationLabel: null,
            shipOriginStreet: null,
            shipOriginCouriers: [],
          }

      const res = await fetch('/api/teknisi/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan pengaturan pengiriman')
        return
      }
      const form = profileToShippingForm(json.data as TeknisiAccountProfileDto)
      setShipOrigin(form.shipOrigin)
      setShipOriginCouriers(form.shipOriginCouriers)
      setMessage('Pengaturan pengiriman berhasil disimpan')
    } catch {
      setError('Gagal menyimpan pengaturan pengiriman')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardPanel title="Pengiriman produk" description="Memuat pengaturan…">
        <p className="text-sm text-surface-500">Memuat…</p>
      </DashboardPanel>
    )
  }

  return (
    <DashboardPanel
      title="Pengiriman produk"
      description="Atur alamat asal dan kurir untuk produk fisik yang Anda jual. Pembeli hanya bisa memilih kurir dari daftar ini."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        )}
        {message && (
          <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">{message}</p>
        )}

        <div>
          <h4 className="mb-1 text-sm font-medium text-surface-700">Alamat pengiriman</h4>
          <p className="mb-4 text-[11px] text-surface-500">
            Dipakai sebagai asal ongkir saat Anda menjual produk fisik.
          </p>
          <ShippingAddressForm
            value={shipOrigin}
            onChange={setShipOrigin}
            showPhone={false}
            showStreet
            streetRequired={false}
          />
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-surface-700">Kurir pengiriman</h4>
          <TeknisiShippingCourierPicker
            value={shipOriginCouriers}
            onChange={setShipOriginCouriers}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-surface-100 pt-4">
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
          </Button>
        </div>
      </form>
    </DashboardPanel>
  )
}
