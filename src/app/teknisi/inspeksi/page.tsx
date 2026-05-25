'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'

export default function TeknisiInspeksiPage() {
  const [items, setItems] = useState<InspectionOrderDto[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teknisi/inspeksi')
      const data = await res.json()
      if (data.success) setItems(data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pending = items.filter((i) => i.status === 'waiting').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Inspeksi</h1>
        <p className="text-sm text-surface-500">
          {pending > 0 ? `${pending} permintaan menunggu respons` : 'Kelola permintaan inspeksi'}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-surface-500">Memuat...</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={`/teknisi/inspeksi/${item.id}`}>
              <Card className="hover:shadow-soft-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-ink">{item.productName}</p>
                    <p className="text-xs text-surface-500">
                      {item.orderCode} · {item.user?.name ?? 'User'}
                    </p>
                  </div>
                  <Badge>{item.statusLabel}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
