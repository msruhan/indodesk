'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatIdrAbs } from '@/lib/admin-saldo'
import { adminWithdrawStatusLabel } from '@/lib/wallet-transactions'
import { RefreshCw } from '@/lib/icons'

type WithdrawRow = {
  id: string
  userName: string
  userEmail: string
  userRole: string
  amount: string
  bankName: string
  accountNumber: string
  accountHolder: string
  status: string
  riskScore: number
  riskFlags: string[]
  rejectionNote: string | null
  createdAt: string
  slaDueAt: string
}

function riskTone(score: number) {
  if (score >= 61) return 'danger' as const
  if (score >= 31) return 'warning' as const
  return 'success' as const
}

function statusVariant(status: string): 'warning' | 'danger' | 'success' | 'default' {
  if (status === 'PENDING') return 'warning'
  if (status === 'REJECT_PENDING_RELEASE') return 'danger'
  return 'default'
}

export function AdminWithdrawPanel() {
  const [items, setItems] = useState<WithdrawRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/wallet/withdraw')
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat antrian penarikan')
        return
      }
      setItems(json.data.items)
    } catch {
      setError('Gagal memuat antrian penarikan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patch = async (id: string, body: Record<string, unknown>) => {
    setActingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/wallet/withdraw/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memperbarui permintaan')
        return
      }
      setPassword('')
      setRejectNotes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await load()
    } catch {
      setError('Gagal memperbarui permintaan')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-surface-600">
          Proses penarikan (SLA 1×24 jam). Transfer bank dilakukan di luar sistem.
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      <div className="rounded-xl border border-surface-200 bg-white p-3">
        <label className="mb-1 block text-xs font-medium text-surface-600">
          Password admin (untuk approve / reject)
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Konfirmasi password"
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-surface-500">Memuat…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-surface-500">Tidak ada permintaan penarikan aktif.</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) => {
            const rejectNote = rejectNotes[row.id] ?? row.rejectionNote ?? ''
            return (
              <div
                key={row.id}
                className="rounded-xl border border-surface-200/80 bg-surface-50/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {row.userName}{' '}
                      <span className="text-xs font-normal text-surface-500">({row.userRole})</span>
                    </p>
                    <p className="text-xs text-surface-500">{row.userEmail}</p>
                    <p className="mt-1 text-lg font-bold text-ink">{formatIdrAbs(row.amount)}</p>
                    <p className="mt-1 text-xs text-surface-600">
                      {row.bankName} · {row.accountNumber} · {row.accountHolder}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusVariant(row.status)}>
                      {adminWithdrawStatusLabel(row.status)}
                    </Badge>
                    <Badge variant={riskTone(row.riskScore)}>Risk {row.riskScore}</Badge>
                  </div>
                </div>

                {row.riskFlags.length > 0 && (
                  <p className="mt-2 text-[11px] text-amber-800">
                    Flags: {row.riskFlags.join(', ')}
                  </p>
                )}

                {row.status === 'PENDING' && (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={rejectNote}
                      onChange={(e) =>
                        setRejectNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      placeholder="Alasan penolakan (wajib jika ditolak)"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!password || actingId === row.id}
                        onClick={() =>
                          void patch(row.id, { action: 'complete', confirmPassword: password })
                        }
                      >
                        Tandai selesai
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!password || !rejectNote.trim() || actingId === row.id}
                        onClick={() =>
                          void patch(row.id, {
                            action: 'reject',
                            rejectionNote: rejectNote,
                            confirmPassword: password,
                          })
                        }
                      >
                        Tolak & kembalikan saldo
                      </Button>
                    </div>
                  </div>
                )}

                {row.status === 'REJECT_PENDING_RELEASE' && (
                  <div className="mt-3 space-y-2">
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Penolakan tahap 1 sudah dicatat, tetapi saldo belum dikembalikan. Klik
                      tombol di bawah untuk mengembalikan saldo ke pengguna.
                    </p>
                    {row.rejectionNote && (
                      <p className="text-xs text-rose-700">Alasan: {row.rejectionNote}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!password || actingId === row.id}
                        onClick={() =>
                          void patch(row.id, {
                            action: 'reject_confirm_release',
                            confirmPassword: password,
                          })
                        }
                      >
                        Kembalikan saldo sekarang
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === row.id}
                        onClick={() => void patch(row.id, { action: 'reject_cancel' })}
                      >
                        Batalkan penolakan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
