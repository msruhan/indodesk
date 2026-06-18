'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/ui/search-input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Globe,
  RefreshCw,
  Eye,
  X,
  Unlock,
  Package,
  ChevronDown,
  Wallet,
} from '@/lib/icons'

function SyncDropdown({
  onSyncImei,
  onSyncServer,
}: {
  onSyncImei: () => void
  onSyncServer: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        title="Sync services"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-blue-50 hover:text-blue-600"
        onClick={() => setOpen(!open)}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-surface-200/80 bg-white p-1 shadow-lg">
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-medium text-surface-700 hover:bg-primary-50 hover:text-primary-700"
              onClick={() => { setOpen(false); onSyncImei() }}
            >
              <Unlock className="h-3.5 w-3.5" />
              Sync Digital Services
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-medium text-surface-700 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => { setOpen(false); onSyncServer() }}
            >
              <Package className="h-3.5 w-3.5" />
              Sync Server Services
            </button>
          </div>
        </>
      )}
    </div>
  )
}

interface ApiProvider {
  id: string
  title: string
  host: string
  username: string
  apiKey: string
  apiType: string
  status: 'ACTIVE' | 'INACTIVE'
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: { services: number }
}

interface SyncedService {
  toolId: string
  title: string
  groupName: string
  price: number
  deliveryTime: string
  requiresNetwork: boolean
  requiresModel: boolean
  requiresProvider: boolean
  requiresPin: boolean
  requiresKbh: boolean
  requiresMep: boolean
  requiresPrd: boolean
  requiresSn: boolean
  alreadyImported: boolean
}

interface SyncResult {
  apiId: string
  apiTitle: string
  totalServices: number
  alreadyImported: number
  services: SyncedService[]
}

function SyncModal({
  apiId,
  apiTitle,
  syncType,
  onClose,
  onImported,
}: {
  apiId: string
  apiTitle: string
  syncType: 'imei' | 'server'
  onClose: () => void
  onImported: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const syncEndpoint = syncType === 'server'
    ? `/api/admin/imei/apis/${apiId}/sync-server`
    : `/api/admin/imei/apis/${apiId}/sync`
  const importEndpoint = syncType === 'server'
    ? `/api/admin/imei/apis/${apiId}/import-server`
    : `/api/admin/imei/apis/${apiId}/import`
  const typeLabel = syncType === 'server' ? 'Server' : 'Digital'

  useEffect(() => {
    const doSync = async () => {
      try {
        const res = await fetch(syncEndpoint, { method: 'POST' })
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Gagal sync')
        } else {
          setSyncResult(data.data)
          // Auto-select services that are not yet imported
          const notImported = (data.data.services as SyncedService[])
            .filter((s) => !s.alreadyImported)
            .map((s) => s.toolId)
          setSelected(new Set(notImported))
        }
      } catch {
        setError('Gagal terhubung ke server')
      } finally {
        setLoading(false)
      }
    }
    doSync()
  }, [apiId, syncEndpoint])

  useEffect(() => {
    if (syncResult && !loading) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [syncResult, loading])

  const toggleSelect = (toolId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(toolId)) next.delete(toolId)
      else next.add(toolId)
      return next
    })
  }

  const filteredServices = useMemo(() => {
    if (!syncResult) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return syncResult.services
    return syncResult.services.filter((s) => {
      const haystack = [
        s.title,
        s.groupName,
        s.toolId,
        s.deliveryTime,
        String(s.price),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [syncResult, searchQuery])

  const filteredAvailable = useMemo(
    () => filteredServices.filter((s) => !s.alreadyImported),
    [filteredServices],
  )

  const toggleAll = () => {
    if (!syncResult) return
    const visibleIds = filteredAvailable.map((s) => s.toolId)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const handleImport = async () => {
    if (!syncResult || selected.size === 0) return
    setImporting(true)
    try {
      const toImport = syncResult.services.filter((s) => selected.has(s.toolId))
      const res = await fetch(importEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: toImport }),
      })
      const data = await res.json()
      if (data.success) {
        setImportResult(`✅ ${data.data.imported} service berhasil diimport${data.data.skipped > 0 ? `, ${data.data.skipped} dilewati (sudah ada)` : ''}`)
        onImported()
      } else {
        setImportResult(`❌ ${data.error}`)
      }
    } catch {
      setImportResult('❌ Gagal import')
    } finally {
      setImporting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-2xl rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Sync {typeLabel} Services — {apiTitle}</h3>
            <p className="mt-0.5 text-xs text-surface-500">
              Mengambil daftar {typeLabel.toLowerCase()} service dari supplier API
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="mt-6 flex flex-col items-center py-10">
            <svg className="h-8 w-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-sm text-surface-500">Menghubungi supplier API...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-4 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <p className="mt-1 text-xs text-red-500">
              {error.includes('tidak memiliki layanan Server') ||
              error.includes('digital saja') ||
              error.includes('SERVICETYPE') ||
              error.includes('imeiservicelist')
                ? 'Ini batasan akun di panel supplier, bukan salah kredensial.'
                : 'Pastikan Host URL, Username, dan API Key sudah benar.'}
            </p>
          </div>
        )}

        {importResult && (
          <div className="mt-4 rounded-xl bg-primary-50 border border-primary-100 p-3 text-center">
            <p className="text-sm font-medium text-primary-700">{importResult}</p>
          </div>
        )}

        {syncResult && !importResult && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <SearchInput
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari ${typeLabel.toLowerCase()} service — nama, grup, ID, harga...`}
                inputClassName="h-10 text-sm pr-9"
                autoComplete="off"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-surface-400 hover:bg-surface-100 hover:text-ink"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-50 p-3">
              <div className="text-xs text-surface-600">
                <span className="font-semibold">{syncResult.totalServices}</span> service ditemukan
                {searchQuery.trim() && (
                  <span className="ml-1 text-surface-500">
                    · menampilkan {filteredServices.length}
                  </span>
                )}
                {syncResult.alreadyImported > 0 && (
                  <span className="ml-2 text-surface-400">
                    ({syncResult.alreadyImported} sudah diimport)
                  </span>
                )}
                <span className="mt-0.5 block text-[10px] text-primary-700">
                  {selected.size} dipilih untuk diimport
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                disabled={filteredAvailable.length === 0}
                className="text-[11px] font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40"
              >
                {filteredAvailable.length > 0 &&
                filteredAvailable.every((s) => selected.has(s.toolId))
                  ? 'Batal pilih semua'
                  : searchQuery.trim()
                    ? 'Pilih semua (filter)'
                    : 'Pilih semua'}
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-1 rounded-xl border border-surface-200/70 p-2">
              {filteredServices.length === 0 ? (
                <p className="py-8 text-center text-xs text-surface-500">
                  Tidak ada service cocok dengan &quot;{searchQuery}&quot;
                </p>
              ) : (
              filteredServices.map((svc) => (
                <label
                  key={svc.toolId}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg p-2 text-xs transition-colors cursor-pointer',
                    svc.alreadyImported
                      ? 'opacity-50 cursor-not-allowed bg-surface-50'
                      : selected.has(svc.toolId)
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-surface-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(svc.toolId)}
                    disabled={svc.alreadyImported}
                    onChange={() => toggleSelect(svc.toolId)}
                    className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{svc.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-surface-500">
                      <span className="text-primary-700 font-semibold">${svc.price}</span>
                      <span>·</span>
                      <span>{svc.groupName}</span>
                      {svc.deliveryTime && (
                        <>
                          <span>·</span>
                          <span>{svc.deliveryTime}</span>
                        </>
                      )}
                      {svc.alreadyImported && (
                        <Badge variant="default" className="text-[8px] px-1 py-0 ml-1">Sudah ada</Badge>
                      )}
                    </div>
                  </div>
                </label>
              ))
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
                Tutup
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1"
                disabled={selected.size === 0 || importing}
                onClick={handleImport}
              >
                {importing ? 'Mengimport...' : `Import ${selected.size} Service`}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function ApiFormModal({
  api,
  onClose,
  onSuccess,
}: {
  api?: ApiProvider | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = Boolean(api)
  const [title, setTitle] = useState(api?.title ?? '')
  const [host, setHost] = useState(api?.host ?? '')
  const [username, setUsername] = useState(api?.username ?? '')
  const [apiKey, setApiKey] = useState('')
  const [apiType, setApiType] = useState(api?.apiType ?? 'DhruFusion')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(api?.status ?? 'ACTIVE')
  const [notes, setNotes] = useState(api?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: Record<string, string> = {
        title,
        host,
        username,
        apiType,
        status,
      }
      if (apiKey.trim()) payload.apiKey = apiKey.trim()
      if (notes.trim()) payload.notes = notes.trim()

      const res = await fetch(
        isEdit ? `/api/admin/imei/apis/${api!.id}` : '/api/admin/imei/apis',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal menyimpan')
        return
      }
      onSuccess()
      onClose()
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-md rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">
              {isEdit ? 'Edit API Provider' : 'Tambah API Provider'}
            </h3>
            <p className="mt-0.5 text-xs text-surface-500">
              {isEdit ? 'Perbarui kredensial supplier digital' : 'Hubungkan ke supplier digital service'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Nama API</label>
            <Input
              placeholder="Contoh: DhruFusion Server 1"
              className="h-9 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Host URL</label>
            <Input
              placeholder="https://api.example.com"
              className="h-9 text-sm"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Username / Email</label>
            <Input
              placeholder="admin@example.com"
              className="h-9 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">API Key</label>
            <Input
              type="password"
              placeholder={isEdit ? 'Kosongkan jika tidak diubah' : '••••••••••••'}
              className="h-9 text-sm"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required={!isEdit}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Tipe API</label>
            <select
              className="h-9 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-ink"
              value={apiType}
              onChange={(e) => setApiType(e.target.value)}
            >
              <option value="DhruFusion">DhruFusion</option>
              <option value="UnlockBase">UnlockBase</option>
              <option value="Custom">Custom API</option>
            </select>
          </div>
          {isEdit && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Status</label>
              <select
                className="h-9 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-ink"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Catatan (opsional)</label>
            <Input
              placeholder="Catatan internal"
              className="h-9 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                <>
                  {isEdit ? <Edit className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {isEdit ? 'Simpan perubahan' : 'Simpan'}
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export function AdminImeiApiPanel() {
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingApi, setEditingApi] = useState<ApiProvider | null>(null)
  const [syncApi, setSyncApi] = useState<{ id: string; title: string; type: 'imei' | 'server' } | null>(null)
  const [apis, setApis] = useState<ApiProvider[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApis = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/imei/apis')
      const data = await res.json()
      if (data.success) {
        setApis(data.data)
      }
    } catch (e) {
      console.error('Failed to fetch APIs:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApis()
  }, [fetchApis])

  const handleCheckApiBalance = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/admin/imei/apis/${id}/account`)
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal cek saldo API')
        return
      }
      const { credit, lowBalance, hint } = data.data
      alert(
        `Saldo API reseller — ${title}\n\nKredit: ${credit ?? '—'}\n\n${hint}${
          lowBalance ? '\n\n⚠️ Ini penyebab umum CreditprocessError saat place order.' : ''
        }`,
      )
    } catch {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus API "${title}"? Aksi ini tidak bisa dibatalkan.`)) return
    try {
      const res = await fetch(`/api/admin/imei/apis/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setApis((prev) => prev.filter((a) => a.id !== id))
      } else {
        alert(data.error || 'Gagal menghapus')
      }
    } catch {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const filtered = apis.filter(
    (api) =>
      !q.trim() ||
      api.title.toLowerCase().includes(q.toLowerCase()) ||
      api.host.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="primary" size="sm" className="h-9 self-start" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          Tambah API
        </Button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari API provider..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat...' : `${filtered.length} API provider terdaftar`}
      </p>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      )}

      {/* API List */}
      {!loading && (
        <div className="space-y-2">
          {filtered.map((api, idx) => (
            <motion.div
              key={api.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">{api.title}</p>
                        <Badge
                          variant={api.status === 'ACTIVE' ? 'success' : 'default'}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {api.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                        <span className="font-mono">{api.host}</span>
                        <span>·</span>
                        <span>{api.username}</span>
                        <span>·</span>
                        <Badge variant="info" className="text-[8px] px-1 py-0">{api.apiType}</Badge>
                        <span>·</span>
                        <span className="font-semibold text-primary-700">
                          {api._count?.services ?? 0} services
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-surface-400">
                        Terakhir update: {new Date(api.updatedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                      <button
                        type="button"
                        title="Cek saldo API reseller (luteam)"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-amber-50 hover:text-amber-700"
                        onClick={() => handleCheckApiBalance(api.id, api.title)}
                      >
                        <Wallet className="h-3.5 w-3.5" />
                      </button>
                      <SyncDropdown
                        onSyncImei={() => setSyncApi({ id: api.id, title: api.title, type: 'imei' })}
                        onSyncServer={() => setSyncApi({ id: api.id, title: api.title, type: 'server' })}
                      />
                      <button
                        type="button"
                        title="Edit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"
                        onClick={() => setEditingApi(api)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Hapus"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => handleDelete(api.id, api.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <Globe className="mx-auto h-6 w-6 text-surface-300" />
              <p className="mt-3 text-sm font-semibold text-ink">Belum ada API provider</p>
              <p className="mt-1 text-xs text-surface-500">
                Tambahkan API supplier untuk mulai menyediakan layanan digital.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <ApiFormModal onClose={() => setShowAdd(false)} onSuccess={fetchApis} />
        )}
        {editingApi && (
          <ApiFormModal
            api={editingApi}
            onClose={() => setEditingApi(null)}
            onSuccess={fetchApis}
          />
        )}
      </AnimatePresence>

      {/* Sync Modal */}
      <AnimatePresence>
        {syncApi && (
          <SyncModal
            apiId={syncApi.id}
            apiTitle={syncApi.title}
            syncType={syncApi.type}
            onClose={() => setSyncApi(null)}
            onImported={fetchApis}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
