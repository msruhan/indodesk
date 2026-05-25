'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare, Plus } from '@/lib/icons'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function statusVariant(status: InspectionOrderDto['status']) {
  if (status === 'completed') return 'success' as const
  if (status === 'rejected' || status === 'cancelled') return 'danger' as const
  if (status === 'disputed') return 'warning' as const
  if (status === 'report_ready') return 'primary' as const
  return 'default' as const
}

export default function UserInspeksiPage() {
  const [items, setItems] = useState<InspectionOrderDto[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/inspeksi')
      const data = await res.json()
      if (data.success) setItems(data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Inspeksi</h1>
          <p className="text-sm text-surface-500">Riwayat permintaan inspeksi pra-beli</p>
        </div>
        <Button asChild variant="primary">
          <Link href="/user/inspeksi/baru">
            <Plus className="mr-2 h-4 w-4" />
            Inspeksi baru
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-surface-500">Memuat...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 font-medium text-ink">Belum ada inspeksi</p>
            <Button asChild className="mt-4" variant="primary">
              <Link href="/user/inspeksi/baru">Buat permintaan pertama</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/user/inspeksi/${item.id}`}>
              <Card className="transition-shadow hover:shadow-soft-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-xs text-surface-500">{item.orderCode}</p>
                    <p className="font-semibold text-ink">{item.productName}</p>
                    <p className="text-xs text-surface-500">
                      {item.modeLabel} · {item.categoryLabel} · {item.teknisi.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusVariant(item.status)}>{item.statusLabel}</Badge>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatPrice(item.price)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
