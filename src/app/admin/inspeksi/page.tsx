'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'

type Stats = {
  total: number
  paid: number
  inProgress: number
  completed: number
  disputed: number
}

export default function AdminInspeksiPage() {
  const [items, setItems] = useState<InspectionOrderDto[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/inspeksi')
      const data = await res.json()
      if (data.success) {
        setItems(data.data.items)
        setStats(data.data.stats)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const resolve = async (id: string, action: 'resolve_refund' | 'resolve_complete') => {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/inspeksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal')
        return
      }
      void load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Monitoring Inspeksi</h1>
        <p className="text-sm text-surface-500">Semua permintaan inspeksi pra-beli</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ['Total', stats.total],
            ['Menunggu', stats.paid],
            ['Proses', stats.inProgress],
            ['Selesai', stats.completed],
            ['Sengketa', stats.disputed],
          ].map(([label, val]) => (
            <Card key={String(label)}>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold tabular-nums text-ink">{val}</p>
                <p className="text-[10px] text-surface-500">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-surface-500">Memuat...</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-ink">{item.productName}</p>
                  <p className="text-xs text-surface-500">
                    {item.orderCode} · {item.user?.name} → {item.teknisi.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.statusLabel}</Badge>
                  {item.status === 'disputed' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === item.id}
                        onClick={() => void resolve(item.id, 'resolve_refund')}
                      >
                        Refund user
                      </Button>
                      <Button
                        size="sm"
                        disabled={busyId === item.id}
                        onClick={() => void resolve(item.id, 'resolve_complete')}
                      >
                        Lanjutkan ke teknisi
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
