'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RefreshCw } from '@/lib/icons'
import {
  fetchAdminTwoFactorEnabled,
  requestAdminStepUpCredentials,
} from '@/lib/admin-step-up-client'

type AlertRow = {
  id: string
  userName: string | null
  userEmail: string | null
  ruleCode: string
  severity: string
  status: string
  title: string
  body: string
  createdAt: string
}

function severityTone(severity: string) {
  if (severity === 'CRITICAL') return 'danger' as const
  if (severity === 'HIGH') return 'warning' as const
  return 'default' as const
}

export function AdminWalletSecurityPanel() {
  const [items, setItems] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/wallet/security-alerts?status=OPEN')
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat alert')
        return
      }
      setItems(json.data.items)
    } catch {
      setError('Gagal memuat alert')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const resolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    let stepUp: { confirmPassword?: string; totp?: string } | undefined
    if (status === 'DISMISSED') {
      const twoFa = await fetchAdminTwoFactorEnabled()
      const creds = await requestAdminStepUpCredentials(twoFa)
      if (!creds) return
      stepUp = creds
    }
    try {
      const res = await fetch(`/api/admin/wallet/security-alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...stepUp }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memperbarui alert')
        return
      }
      await load()
    } catch {
      setError('Gagal memperbarui alert')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-surface-600">
          Deteksi anomali saldo: kredit tanpa referensi valid, risiko penarikan tinggi, drift ledger.
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-surface-500">Memuat…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-surface-500">Tidak ada alert keamanan terbuka.</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-surface-200/80 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{row.title}</p>
                  <p className="mt-1 text-xs text-surface-500">
                    {row.userName ?? 'Platform'} · {row.ruleCode}
                  </p>
                </div>
                <Badge variant={severityTone(row.severity)}>{row.severity}</Badge>
              </div>
              <p className="mt-2 text-sm text-surface-600">{row.body}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void resolve(row.id, 'RESOLVED')}>
                  Selesai
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void resolve(row.id, 'DISMISSED')}>
                  Abaikan
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
