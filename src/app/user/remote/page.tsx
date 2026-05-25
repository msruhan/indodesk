'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { DashboardPageHeader, MetricCard } from '@/components/dashboard'
import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/filter-dropdown'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Clock,
  Laptop,
  Radio,
  RefreshCw,
  Search,
  Shield,
  XCircle,
} from '@/lib/icons'
import type { UserRemoteDto } from '@/lib/user-remote-serializer'
import type { TeknisiRemoteUiStatus } from '@/lib/teknisi-layanan-serializer'

type StatusFilter = TeknisiRemoteUiStatus | 'all'

const statusConfig: Record<
  string,
  { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; icon: typeof Clock }
> = {
  waiting: { label: 'Menunggu', variant: 'warning', icon: Clock },
  active: { label: 'Aktif', variant: 'info', icon: Radio },
  rejected: { label: 'Ditolak', variant: 'danger', icon: XCircle },
  completed: { label: 'Selesai', variant: 'success', icon: CheckCircle },
}

export default function UserRemotePage() {
  const [items, setItems] = useState<UserRemoteDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/remote')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat')
        return
      }
      setItems(json.data ?? [])
    } catch {
      setError('Gagal memuat riwayat remote')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(
    () => ({
      total: items.length,
      waiting: items.filter((i) => i.status === 'waiting').length,
      active: items.filter((i) => i.status === 'active').length,
      completed: items.filter((i) => i.status === 'completed').length,
    }),
    [items],
  )

  const platformOptions = useMemo((): FilterDropdownOption<string>[] => {
    const platforms = new Set<string>()
    for (const item of items) {
      if (item.platform?.trim()) platforms.add(item.platform.trim())
    }
    const countFor = (platform?: string) =>
      platform ? items.filter((i) => i.platform === platform).length : items.length

    return [
      { id: 'all', label: 'Semua platform', tone: 'neutral', icon: Laptop },
      ...Array.from(platforms)
        .sort((a, b) => a.localeCompare(b, 'id'))
        .map((p) => ({
          id: p,
          label: p,
          tone: 'primary' as const,
          icon: Laptop,
          count: countFor(p),
        })),
    ]
  }, [items])

  const statusFilterOptions = useMemo((): FilterDropdownOption<StatusFilter>[] => {
    const countFor = (status?: TeknisiRemoteUiStatus) =>
      status ? items.filter((i) => i.status === status).length : items.length

    return [
      { id: 'all', label: 'Semua status', tone: 'neutral', icon: Radio },
      {
        id: 'waiting',
        label: statusConfig.waiting.label,
        tone: 'warning',
        icon: statusConfig.waiting.icon,
        count: countFor('waiting'),
      },
      {
        id: 'active',
        label: statusConfig.active.label,
        tone: 'info',
        icon: statusConfig.active.icon,
        count: countFor('active'),
      },
      {
        id: 'completed',
        label: statusConfig.completed.label,
        tone: 'success',
        icon: statusConfig.completed.icon,
        count: countFor('completed'),
      },
      {
        id: 'rejected',
        label: statusConfig.rejected.label,
        tone: 'danger',
        icon: statusConfig.rejected.icon,
        count: countFor('rejected'),
      },
    ]
  }, [items])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (platformFilter !== 'all' && item.platform !== platformFilter) return false
      if (!q) return true
      const haystack = [
        item.sessionCode,
        item.remoteId,
        item.description ?? '',
        item.platform ?? '',
        item.teknisiName,
        item.statusLabel,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, query, statusFilter, platformFilter])

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Remote Support"
        description="Riwayat permintaan remote support ke teknisi."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total"
          value={stats.total.toString()}
          icon={Laptop}
          footnote="Semua sesi"
          tone="primary"
          compact
        />
        <MetricCard
          title="Menunggu"
          value={stats.waiting.toString()}
          icon={Clock}
          footnote="Belum diterima"
          tone={stats.waiting > 0 ? 'warning' : 'neutral'}
          compact
        />
        <MetricCard
          title="Aktif"
          value={stats.active.toString()}
          icon={Radio}
          footnote="Sedang berjalan"
          tone="primary"
          compact
        />
        <MetricCard
          title="Selesai"
          value={stats.completed.toString()}
          icon={CheckCircle}
          footnote="Berhasil"
          tone="primary"
          compact
        />
      </div>

      <div>
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className={cn(searchInputIconClass, 'left-3.5')} strokeWidth={2} aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode sesi, ID remote, deskripsi, teknisi..."
              className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
            />
          </div>
          <FilterDropdown
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter status"
            label="Status"
            triggerIcon={Clock}
            placeholder="Semua status"
            className="w-full sm:w-[11.5rem]"
            align="right"
          />
          <FilterDropdown
            options={platformOptions}
            value={platformFilter}
            onChange={setPlatformFilter}
            ariaLabel="Filter platform"
            label="Platform"
            triggerIcon={Laptop}
            placeholder="Semua platform"
            className="w-full sm:w-[11.5rem]"
            align="right"
          />
        </div>

        <p className="mb-3 text-[11px] text-surface-500">
          {loading ? 'Memuat...' : `${filteredItems.length} sesi`}
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-50"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="shadow-soft-xs">
            <CardContent className="p-8 text-center">
              <Laptop className="mx-auto mb-3 h-8 w-8 text-surface-400" />
              <p className="text-sm font-semibold text-ink">Belum ada sesi remote</p>
              <p className="mt-1 text-xs text-surface-500">
                Ajukan permintaan remote support ke teknisi untuk bantuan jarak jauh.
              </p>
              <Link href="/remote" className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  Minta Remote
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="shadow-soft-xs">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-surface-600">Tidak ada sesi yang cocok dengan filter.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('')
                  setStatusFilter('all')
                  setPlatformFilter('all')
                }}
              >
                Reset filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, idx) => {
              const cfg = statusConfig[item.status] ?? statusConfig.waiting
              const StatusIcon = cfg.icon
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card
                    className={cn(
                      'transition-all hover:shadow-soft-md',
                      item.status === 'waiting' && 'border-amber-200/70',
                      item.status === 'active' && 'border-blue-200/70',
                    )}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                              item.status === 'waiting' &&
                                'bg-amber-50 text-amber-700 ring-amber-200/70',
                              item.status === 'active' &&
                                'bg-blue-50 text-blue-700 ring-blue-200/70',
                              item.status === 'completed' &&
                                'bg-primary-50 text-primary-700 ring-primary-200/70',
                              item.status === 'rejected' &&
                                'bg-red-50 text-red-700 ring-red-200/70',
                            )}
                          >
                            <StatusIcon className="h-[18px] w-[18px]" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[13px] font-semibold text-ink">
                                {item.sessionCode}
                              </span>
                              <Badge variant={cfg.variant} className="px-2 py-0.5 text-[10px]">
                                {cfg.label}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[13px] text-surface-700">
                              {item.description ?? 'Permintaan remote support'}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-surface-500">
                              <span className="inline-flex items-center gap-1">
                                <Laptop className="h-3 w-3" />
                                {item.platform ?? 'Unknown'}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Shield className="h-3 w-3 text-primary-600" />
                                ID: {item.remoteId}
                              </span>
                              <span>Teknisi: {item.teknisiName}</span>
                              <span>{item.dateLabel}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
