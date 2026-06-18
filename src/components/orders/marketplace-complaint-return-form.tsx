'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SHIPPING_COURIER_OPTIONS } from '@/lib/shipping-courier'
import type { ShippingCourier } from '@prisma/client'
import type { OrderComplaintDto } from '@/lib/marketplace-order-complaint-serializer'
import { formatBuyerActionDeadline } from '@/components/orders/marketplace-complaint-form'

type MarketplaceComplaintReturnFormProps = {
  orderId: string
  complaint: OrderComplaintDto
  onSuccess: () => void
}

export function MarketplaceComplaintReturnForm({
  orderId,
  complaint,
  onSuccess,
}: MarketplaceComplaintReturnFormProps) {
  const [courier, setCourier] = useState<ShippingCourier>(
    SHIPPING_COURIER_OPTIONS[0]?.value ?? 'JNT',
  )
  const [trackingNumber, setTrackingNumber] = useState('')
  const [returnPhotos, setReturnPhotos] = useState<File[]>([])
  const [returnVideos, setReturnVideos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deadlineLabel = formatBuyerActionDeadline(complaint.returnDeadline)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('courier', courier)
      fd.append('trackingNumber', trackingNumber)
      returnPhotos.forEach((f) => fd.append('returnPhotos', f))
      returnVideos.forEach((f) => fd.append('returnVideos', f))

      const res = await fetch(`/api/user/marketplace/orders/${orderId}/complaint/return`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengirim data retur')
        return
      }
      onSuccess()
    } catch {
      setError('Gagal mengirim data retur')
    } finally {
      setLoading(false)
    }
  }

  const addr = complaint.returnAddress

  return (
    <div className="space-y-3">
      {deadlineLabel && (
        <p className="text-xs font-medium text-amber-800">
          Kirim barang retur paling lambat {deadlineLabel}
        </p>
      )}

      {addr && (
        <div className="rounded-xl border border-surface-200 bg-white p-3 text-xs text-surface-700">
          <p className="font-semibold text-ink">Alamat pengiriman balik</p>
          <p className="mt-1">{addr.storeName}</p>
          {addr.address && <p>{addr.address}</p>}
          {addr.city && <p>{addr.city}</p>}
          {addr.phone && <p>HP: {addr.phone}</p>}
        </div>
      )}

      <p className="text-[11px] text-surface-500">
        Ongkir retur ditanggung pembeli (di luar saldo platform).
      </p>

      <div className="rounded-xl border border-surface-200/80 bg-surface-50/50 p-3">
        <label className="mb-1 block text-xs font-semibold text-surface-800">
          Foto pengemasan retur (wajib, min. 1)
        </label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setReturnPhotos(Array.from(e.target.files ?? []))}
        />
      </div>

      <div className="rounded-xl border border-surface-200/80 bg-surface-50/50 p-3">
        <label className="mb-1 block text-xs font-semibold text-surface-800">
          Video pengiriman retur (wajib, min. 1)
        </label>
        <Input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => setReturnVideos(Array.from(e.target.files ?? []))}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-700">Kurir</label>
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value as ShippingCourier)}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
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
            placeholder="Min. 6 karakter"
          />
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <Button variant="primary" size="sm" disabled={loading} onClick={() => void submit()}>
        {loading ? 'Mengirim…' : 'Kirim Data Retur'}
      </Button>
    </div>
  )
}
