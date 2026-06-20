'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from '@/lib/icons'

type Props = {
  orderId: string
  orderCode: string
  className?: string
}

export function ShippingLabelDownloadButton({ orderId, orderCode, className }: Props) {
  const [loading, setLoading] = useState(false)

  const download = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace/orders/${orderId}/shipping-label`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        alert(json?.error ?? 'Gagal mengunduh label pengiriman')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `label-${orderCode}.png`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Gagal mengunduh label pengiriman')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={className ?? 'h-8'}
      disabled={loading}
      onClick={() => void download()}
    >
      <Download className="h-3.5 w-3.5" />
      {loading ? 'Menyiapkan…' : 'Unduh label pengiriman'}
    </Button>
  )
}
