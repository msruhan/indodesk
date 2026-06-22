'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { IndodeskDeviceDto } from '@/lib/indodesk-device'
import { toast } from 'sonner'

type Props = {
  defaultRole?: 'user' | 'teknisi'
  className?: string
}

export function IndodeskPairingPanel({ defaultRole = 'user', className }: Props) {
  const [role, setRole] = useState<'user' | 'teknisi'>(defaultRole)
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [devices, setDevices] = useState<IndodeskDeviceDto[]>([])
  const [loading, setLoading] = useState(false)

  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/indodesk/devices')
      const json = await res.json()
      if (json.success) setDevices(json.data.items as IndodeskDeviceDto[])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadDevices()
  }, [loadDevices])

  const generateCode = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/indodesk/pair/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error ?? 'Gagal membuat kode')
        return
      }
      setCode(json.data.code as string)
      setExpiresAt(json.data.expiresAt as string)
      toast.success('Kode pairing dibuat')
    } catch {
      toast.error('Gagal membuat kode pairing')
    } finally {
      setLoading(false)
    }
  }

  const removeDevice = async (id: string) => {
    const res = await fetch(`/api/indodesk/devices/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) {
      toast.error(json.error ?? 'Gagal menghapus')
      return
    }
    toast.success('Perangkat dihapus')
    void loadDevices()
  }

  return (
    <div className={cn('rounded-xl border border-surface-200 bg-white p-4', className)}>
      <h3 className="text-sm font-semibold text-ink">Hubungkan IndoDesk ke akun</h3>
      <p className="mt-1 text-xs text-surface-600">
        Buat kode di web, lalu masukkan kode tersebut di aplikasi IndoDesk (menu Pairing).
      </p>

      <div className="mt-3 flex gap-2">
        {(['user', 'teknisi'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              'flex-1 rounded-lg border px-3 py-2 text-xs',
              role === r
                ? 'border-primary-300 bg-primary-50 font-medium text-primary-800'
                : 'border-surface-200 text-surface-600',
            )}
          >
            {r === 'user' ? 'Pelanggan' : 'Teknisi'}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="primary"
        size="sm"
        className="mt-3"
        disabled={loading}
        onClick={() => void generateCode()}
      >
        Buat kode pairing
      </Button>

      {code && (
        <div className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wide text-primary-700">Kode 6 digit</p>
          <p className="font-mono text-2xl font-bold tracking-[0.2em] text-primary-900">{code}</p>
          {expiresAt && (
            <p className="mt-1 text-[10px] text-surface-500">
              Kedaluwarsa{' '}
              {new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(expiresAt))}
            </p>
          )}
        </div>
      )}

      {devices.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-surface-700">Perangkat terhubung</p>
          {devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-surface-100 px-2 py-1.5 text-xs"
            >
              <div>
                <p className="font-mono text-ink">{d.rustdeskId}</p>
                <p className="text-surface-500">
                  {d.role === 'user' ? 'Pelanggan' : 'Teknisi'}
                  {d.platform ? ` · ${d.platform}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] text-rose-600"
                onClick={() => void removeDevice(d.id)}
              >
                Hapus
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
