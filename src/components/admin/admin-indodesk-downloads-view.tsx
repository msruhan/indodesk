'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Laptop, ExternalLink } from '@/lib/icons'
import type { IndodeskDownloadDto } from '@/lib/indodesk-download'

type FormState = {
  downloadUrl: string
  version: string
  fileSize: string
  isActive: boolean
}

function toForm(row: IndodeskDownloadDto): FormState {
  return {
    downloadUrl: row.downloadUrl,
    version: row.version,
    fileSize: row.fileSize ?? '',
    isActive: row.isActive,
  }
}

export function AdminIndodeskDownloadsView() {
  const [items, setItems] = useState<IndodeskDownloadDto[]>([])
  const [forms, setForms] = useState<Record<string, FormState>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/indodesk/downloads', { cache: 'no-store' })
      const json = (await res.json()) as { success?: boolean; data?: IndodeskDownloadDto[] }
      if (res.ok && json.success && Array.isArray(json.data)) {
        setItems(json.data)
        const next: Record<string, FormState> = {}
        for (const row of json.data) {
          next[`${row.platform}-${row.role}`] = toForm(row)
        }
        setForms(next)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const updateField = (key: string, field: keyof FormState, value: string | boolean) => {
    setForms((prev) => ({
      ...prev,
      [key]: { ...prev[key]!, [field]: value },
    }))
  }

  const save = async (platform: string, role: string) => {
    const key = `${platform}-${role}`
    const form = forms[key]
    if (!form) return
    setSaving(key)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/indodesk/downloads/${platform}?role=${role}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadUrl: form.downloadUrl.trim(),
          version: form.version.trim(),
          fileSize: form.fileSize.trim() || null,
          isActive: form.isActive,
        }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !json.success) {
        setMessage(json.error ?? 'Gagal menyimpan')
        return
      }
      setMessage(`Link ${platform} (${role}) berhasil disimpan.`)
      await load()
    } catch {
      setMessage('Gagal menyimpan perubahan')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-surface-500">Memuat konfigurasi download...</p>
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">{message}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((row) => {
          const key = `${row.platform}-${row.role}`
          const form = forms[key]
          if (!form) return null
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Laptop className="h-4 w-4 text-primary-600" />
                  {row.platformLabel} · {row.roleLabel}
                </CardTitle>
                <Badge variant={form.isActive ? 'success' : 'outline'}>
                  {form.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">
                    URL Download
                  </label>
                  <Input
                    value={form.downloadUrl}
                    onChange={(e) => updateField(key, 'downloadUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-surface-600">Versi</label>
                    <Input
                      value={form.version}
                      onChange={(e) => updateField(key, 'version', e.target.value)}
                      placeholder="1.3.7"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-surface-600">Ukuran</label>
                    <Input
                      value={form.fileSize}
                      onChange={(e) => updateField(key, 'fileSize', e.target.value)}
                      placeholder="~15 MB"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-surface-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateField(key, 'isActive', e.target.checked)}
                    className="rounded border-surface-300"
                  />
                  Tampilkan di halaman Remote
                </label>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={saving === key}
                    onClick={() => void save(row.platform, row.role)}
                  >
                    {saving === key ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                  {form.isActive && form.downloadUrl && (
                    <a
                      href={form.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <span className="relative z-10 inline-flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        Lihat link
                      </span>
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-surface-500">
                  Terakhir diubah:{' '}
                  {new Date(row.updatedAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
