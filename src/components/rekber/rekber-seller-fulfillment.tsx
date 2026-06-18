'use client'

import { useState } from 'react'
import type { ShippingCourier } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PackagingProofForm } from '@/components/marketplace/packaging-proof-form'
import { SHIPPING_COURIER_OPTIONS } from '@/lib/shipping-courier'
import type { RekberDto } from '@/lib/rekber-serializer'

type Props = {
  rekber: RekberDto
  busy?: boolean
  onRefresh: () => void
  onAdvance: (id: string) => void
  onSetShipment: (id: string, courier: ShippingCourier, trackingNumber: string) => void
}

export function RekberSellerFulfillment({
  rekber,
  busy,
  onRefresh,
  onAdvance,
  onSetShipment,
}: Props) {
  const [courier, setCourier] = useState<ShippingCourier>('JNE')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shipmentError, setShipmentError] = useState<string | null>(null)

  const showFulfillment =
    rekber.role === 'seller' &&
    (rekber.canUploadPackaging ||
      rekber.canAdvance ||
      rekber.canSetShipment ||
      rekber.packagingProof ||
      rekber.tracking)

  if (!showFulfillment) return null

  const submitShipment = () => {
    setShipmentError(null)
    const awb = trackingNumber.trim()
    if (awb.length < 5) {
      setShipmentError('Nomor resi minimal 5 karakter')
      return
    }
    onSetShipment(rekber.id, courier, awb)
  }

  return (
    <div className="mt-4 space-y-3 border-t border-surface-200 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">
        Pemenuhan pesanan
      </p>

      <PackagingProofForm
        orderId={rekber.id}
        proof={rekber.packagingProof}
        canSubmit={rekber.canUploadPackaging}
        requiresProof={rekber.requiresPackaging}
        uploadUrl={`/api/rekber/${rekber.id}/packaging`}
        onSuccess={onRefresh}
      />

      {rekber.canAdvance && (
        <Button
          size="sm"
          variant="primary"
          disabled={busy}
          onClick={() => onAdvance(rekber.id)}
        >
          Proses pesanan
        </Button>
      )}

      {rekber.canSetShipment && (
        <div className="space-y-2 rounded-2xl border border-surface-200 bg-surface-50/60 p-4">
          <p className="text-[12px] font-semibold text-ink">Input resi pengiriman</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-700">Kurir</label>
              <select
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                value={courier}
                onChange={(e) => setCourier(e.target.value as ShippingCourier)}
              >
                {SHIPPING_COURIER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-700">Nomor resi</label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Contoh: JNE1234567890"
              />
            </div>
          </div>
          {shipmentError && <p className="text-xs text-rose-600">{shipmentError}</p>}
          <Button size="sm" variant="primary" disabled={busy} onClick={submitShipment}>
            Kirim & lacak paket
          </Button>
        </div>
      )}

      {rekber.tracking && (
        <div className="rounded-xl border border-primary-100 bg-primary-50/40 px-3 py-2 text-xs text-primary-900">
          <p className="font-semibold">
            {rekber.tracking.courierLabel} ·{' '}
            <span className="font-mono">{rekber.tracking.trackingNumber}</span>
          </p>
          {rekber.tracking.summaryDesc && (
            <p className="mt-1 text-primary-800">{rekber.tracking.summaryDesc}</p>
          )}
          {rekber.tracking.summaryStatus && (
            <p className="mt-0.5 text-[11px] text-primary-700">
              Status: {rekber.tracking.summaryStatus}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
