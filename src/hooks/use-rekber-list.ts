'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ShippingCourier } from '@prisma/client'
import type { RekberDto, RekberStats } from '@/lib/rekber-serializer'
import { buildRekberStats } from '@/lib/rekber-serializer'

const emptyStats: RekberStats = {
  total: 0,
  pending: 0,
  held: 0,
  processing: 0,
  shipped: 0,
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
    async (id: string, action: 'fund' | 'release' | 'cancel' | 'advance') => {
      const labels: Record<typeof action, string> = {
        fund: 'membayar dan menahan dana',
        release: 'melepas dana ke penjual',
        cancel: 'membatalkan rekber',
        advance: 'memproses pesanan',
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

  const advanceRekber = useCallback(
    async (id: string) => {
      if (!window.confirm('Yakin ingin memproses pesanan ini?')) return
      setActingId(id)
      setError(null)
      try {
        const res = await fetch(`/api/rekber/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'advance' }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal memproses rekber')
          return
        }
        await load()
      } catch {
        setError('Gagal memproses rekber')
      } finally {
        setActingId(null)
      }
    },
    [load],
  )

  const setShipment = useCallback(
    async (id: string, courier: ShippingCourier, trackingNumber: string) => {
      setActingId(id)
      setError(null)
      try {
        const res = await fetch(`/api/rekber/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_shipment', courier, trackingNumber }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal menyimpan resi')
          return
        }
        await load()
      } catch {
        setError('Gagal menyimpan resi')
      } finally {
        setActingId(null)
      }
    },
    [load],
  )

  const submitComplaint = useCallback(
    async (id: string, payload: { reason: string; defectPhotos: File[]; unboxingVideos: File[] }) => {
      setActingId(id)
      setError(null)
      try {
        const fd = new FormData()
        fd.append('reason', payload.reason)
        payload.defectPhotos.forEach((f) => fd.append('defectPhotos', f))
        payload.unboxingVideos.forEach((f) => fd.append('unboxingVideos', f))
        const res = await fetch(`/api/rekber/${id}/complaint`, {
          method: 'POST',
          body: fd,
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal mengajukan komplain')
          return false
        }
        await load()
        return true
      } catch {
        setError('Gagal mengajukan komplain')
        return false
      } finally {
        setActingId(null)
      }
    },
    [load],
  )

  const respondComplaint = useCallback(
    async (id: string, response: string) => {
      setActingId(id)
      setError(null)
      try {
        const res = await fetch(`/api/rekber/${id}/complaint/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal mengirim respons')
          return false
        }
        await load()
        return true
      } catch {
        setError('Gagal mengirim respons')
        return false
      } finally {
        setActingId(null)
      }
    },
    [load],
  )

  const escalateComplaint = useCallback(
    async (id: string) => {
      if (!window.confirm('Eskalasi komplain ini ke Admin?')) return
      setActingId(id)
      setError(null)
      try {
        const res = await fetch(`/api/rekber/${id}/complaint/escalate`, { method: 'POST' })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal eskalasi komplain')
          return
        }
        await load()
      } catch {
        setError('Gagal eskalasi komplain')
      } finally {
        setActingId(null)
      }
    },
    [load],
  )

  const withdrawComplaint = useCallback(
    async (id: string) => {
      if (!window.confirm('Tarik komplain ini?')) return
      setActingId(id)
      setError(null)
      try {
        const res = await fetch(`/api/rekber/${id}/complaint/withdraw`, { method: 'POST' })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal menarik komplain')
          return
        }
        await load()
      } catch {
        setError('Gagal menarik komplain')
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
    advanceRekber,
    setShipment,
    submitComplaint,
    respondComplaint,
    escalateComplaint,
    withdrawComplaint,
    adminResolve,
  }
}
