'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardPanel } from '@/components/dashboard'
import { AdminStepUpFields } from '@/components/admin/admin-step-up-fields'
import { fetchAdminTwoFactorEnabled } from '@/lib/admin-step-up-client'
import { cn } from '@/lib/utils'
import { Download, RefreshCw, Shield, FolderKanban } from '@/lib/icons'

type BackupItem = {
  id: string
  type: 'daily' | 'manual'
  tag: string | null
  createdAt: string
  databaseSizeLabel: string
  uploadsSizeLabel: string
  totalSizeLabel: string
  status: string
}

type BackupResponse = {
  configured: boolean
  items: BackupItem[]
  lastBackup: BackupItem | null
  stats: { dailyCount: number; manualCount: number }
  job: { status: string; message: string | null }
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function AdminBackupView() {
  const [data, setData] = useState<BackupResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminTwoFa, setAdminTwoFa] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [triggering, setTriggering] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/backup')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat backup')
        return
      }
      setData(json.data)
    } catch {
      setError('Gagal memuat backup')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void fetchAdminTwoFactorEnabled().then(setAdminTwoFa)
  }, [load])

  useEffect(() => {
    if (!data?.job || (data.job.status !== 'running' && data.job.status !== 'idle')) return
    const t = setInterval(() => void load(), 8000)
    return () => clearInterval(t)
  }, [data?.job, load])

  const handleTrigger = async () => {
    setTriggering(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPassword: adminTwoFa ? undefined : confirmPassword || undefined,
          totp: adminTwoFa ? totp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menjadwalkan backup')
        return
      }
      setMessage(json.data?.message ?? 'Backup dijadwalkan')
      setConfirmPassword('')
      setTotp('')
      void load()
    } catch {
      setError('Gagal menjadwalkan backup')
    } finally {
      setTriggering(false)
    }
  }

  const handleDownload = async (backupId: string, artifact: 'database' | 'uploads') => {
    setDownloadingId(`${backupId}-${artifact}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/backup/${encodeURIComponent(backupId)}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact,
          confirmPassword: adminTwoFa ? undefined : confirmPassword || undefined,
          totp: adminTwoFa ? totp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal unduh')
        return
      }
      window.open(json.data.url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Gagal unduh')
    } finally {
      setDownloadingId(null)
    }
  }

  const jobRunning =
    data?.job?.status === 'running' ||
    (data?.job?.message?.includes('Menunggu') ?? false)

  return (
    <div className="space-y-4">
      {!data?.configured && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Backup R2 belum dikonfigurasi. Set variabel <code className="text-xs">BACKUP_R2_*</code> di
          server dan buat bucket <strong>bantoo-backups</strong>.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,340px)]">
        <DashboardPanel
          title="Status backup"
          description="Database PostgreSQL + volume uploads lokal"
          action={
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          }
        >
          {loading && !data ? (
            <p className="text-sm text-surface-500">Memuat…</p>
          ) : data?.lastBackup ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-surface-500">Terakhir:</span>{' '}
                <span className="font-medium text-ink">{formatDate(data.lastBackup.createdAt)}</span>
              </p>
              <p>
                <span className="text-surface-500">Tipe:</span>{' '}
                <Badge variant={data.lastBackup.type === 'daily' ? 'info' : 'warning'}>
                  {data.lastBackup.type}
                </Badge>
                {data.lastBackup.tag ? (
                  <span className="ml-2 text-xs text-surface-500">({data.lastBackup.tag})</span>
                ) : null}
              </p>
              <p className="text-surface-600">Total {data.lastBackup.totalSizeLabel}</p>
              {data.job.status === 'running' && (
                <p className="text-xs text-amber-700">{data.job.message ?? 'Backup berjalan…'}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-500">Belum ada backup terindeks di R2.</p>
          )}
        </DashboardPanel>

        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-950">Restore via VPS</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                Mengembalikan database hanya dapat dilakukan operator via SSH. Lihat panduan deploy.
              </p>
              <Link
                href="/admin/help"
                className="mt-2 inline-block text-xs font-medium text-amber-900 underline underline-offset-2"
              >
                Runbook: docs/deploy/DATABASE-BACKUP.md
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AdminStepUpFields
        confirmPassword={confirmPassword}
        totp={totp}
        onConfirmPasswordChange={setConfirmPassword}
        onTotpChange={setTotp}
        twoFactorEnabled={adminTwoFa}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={!data?.configured || triggering || jobRunning}
          onClick={() => void handleTrigger()}
        >
          <FolderKanban className="h-4 w-4" />
          {triggering ? 'Menjadwalkan…' : 'Backup sekarang'}
        </Button>
        <p className="text-xs text-surface-500 self-center">
          Retensi: daily 14 hari · manual 30 hari
        </p>
      </div>

      <DashboardPanel title="Riwayat backup" description="Unduh artefak untuk arsip (presigned URL 15 menit)">
        {data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-xs text-surface-500">
                  <th className="pb-2 pr-4 font-medium">Waktu</th>
                  <th className="pb-2 pr-4 font-medium">Tipe</th>
                  <th className="pb-2 pr-4 font-medium">DB</th>
                  <th className="pb-2 pr-4 font-medium">Uploads</th>
                  <th className="pb-2 font-medium">Unduh</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-surface-100">
                    <td className="py-3 pr-4">
                      <p className="font-mono text-xs">{item.id}</p>
                      <p className="text-[11px] text-surface-500">{formatDate(item.createdAt)}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={item.type === 'daily' ? 'info' : 'warning'}>{item.type}</Badge>
                      {item.tag ? (
                        <p className="mt-0.5 text-[10px] text-surface-500">{item.tag}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-surface-600">{item.databaseSizeLabel}</td>
                    <td className="py-3 pr-4 tabular-nums text-surface-600">{item.uploadsSizeLabel}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={downloadingId === `${item.id}-database`}
                          onClick={() => void handleDownload(item.id, 'database')}
                        >
                          <Download className="h-3.5 w-3.5" />
                          DB
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={downloadingId === `${item.id}-uploads`}
                          onClick={() => void handleDownload(item.id, 'uploads')}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Uploads
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-surface-500">Belum ada backup.</p>
        )}
      </DashboardPanel>
    </div>
  )
}
