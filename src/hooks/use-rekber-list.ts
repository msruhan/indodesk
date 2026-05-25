'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RekberDto, RekberStats } from '@/lib/rekber-serializer'
import { buildRekberStats } from '@/lib/rekber-serializer'

const emptyStats: RekberStats = {
  total: 0,
  pending: 0,
  held: 0,
  released: 0,
  disputed: 0,
  refunded: 0,
}

type RekberListResponse = {
  items: RekberDto[]
  stats: RekberStats
}

export function useRekberList(
  apiPath: '/api/rekber' | '/api/admin/rekber',
  enabled = true,
) {
  const [items, setItems] = useState<RekberDto[]>([])
  const [stats, setStats] = useState<RekberStats>(emptyStats)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) {
      setItems([])
      setStats(emptyStats)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiPath, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat rekber')
        return
      }
      const data = json.data as RekberListResponse
      const list = data?.items ?? []
      setItems(list)
      setStats(data?.stats ?? buildRekberStats(list))
    } catch {
      setError('Gagal memuat rekber')
    } finally {
      setLoading(false)
    }
  }, [apiPath, enabled])

  useEffect(() => {
    void load()
  }, [load])

  const userAction = useCallback(
    async (id: string, action: 'fund' | 'release' | 'dispute' | 'cancel') => {
      const labels: Record<typeof action, string> = {
        fund: 'membayar dan menahan dana',
        release: 'melepas dana ke penjual',
        dispute: 'membuka dispute',
        cancel: 'membatalkan rekber',
      }
      if (!window.confirm(`Yakin ingin ${labels[action]}?`)) return

      setActingId(id)
      setError(null)
      try {
        const res = await fetch(`/api/rekber/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal memperbarui rekber')
          return
        }
        await load()
      } catch {
        setError('Gagal memperbarui rekber')
      } finally {
        setActingId(null)
      }
    },
    [load],
  )

  const adminResolve = useCallback(
    async (id: string, action: 'release' | 'refund') => {
      const label = action === 'release' ? 'melepas dana ke penjual' : 'mengembalikan dana ke pembeli'
      if (!window.confirm(`Yakin ingin ${label}?`)) return

      setActingId(id)
      setError(null)
      try {
        const res = await fetch(`/api/admin/rekber/${id}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal menyelesaikan rekber')
          return
        }
        await load()
      } catch {
        setError('Gagal menyelesaikan rekber')
      } finally {
        setActingId(null)
      }
    },
    [load],
  )

  return {
    items,
    stats,
    loading,
    error,
    actingId,
    load,
    userAction,
    adminResolve,
  }
}
