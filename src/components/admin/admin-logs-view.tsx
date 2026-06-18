'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { CategoryFilterDropdown } from '@/components/ui/category-filter-dropdown'
import { DashboardMonthFilter, MetricCard } from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { useSyncPeriodToDateInputs } from '@/hooks/use-sync-period-to-date-inputs'
import { DataPagination } from '@/components/ui/data-pagination'
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from '@/lib/pagination'
import { buildActivityLogChronology } from '@/lib/activity-log-narrative'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  History,
  Lock,
  MessageCircle,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  X,
} from '@/lib/icons'

type ActivityCategory = 'AUTH' | 'ACCOUNT' | 'ORDER' | 'PAYMENT' | 'COMMUNICATION' | 'ADMIN' | 'SECURITY' | 'SYSTEM'
type ActivitySeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'

type LogItem = {
  id: string
  action: string
  category: ActivityCategory
  severity: ActivitySeverity
  summary: string
  detail: string | null
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
  actorRole: 'ADMIN' | 'TEKNISI' | 'USER' | null
  targetType: string | null
  targetId: string | null
  targetLabel: string | null
  ip: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

type LogStats = {
  total: number
  totalToday: number
  totalWeek: number
  warnings24h: number
  criticals24h: number
}

const categoryConfig: Record<ActivityCategory, { label: string; icon: typeof Shield; tone: string }> = {
  AUTH: { label: 'Auth', icon: Lock, tone: 'bg-violet-50 text-violet-700 ring-violet-200/70' },
  ACCOUNT: { label: 'Akun', icon: Users, tone: 'bg-accent-50 text-accent-700 ring-accent-200/70' },
  ORDER: { label: 'Order', icon: Wrench, tone: 'bg-blue-50 text-blue-700 ring-blue-200/70' },
  PAYMENT: { label: 'Payment', icon: Wallet, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
  COMMUNICATION: { label: 'Komunikasi', icon: MessageCircle, tone: 'bg-primary-50 text-primary-700 ring-primary-200/70' },
  ADMIN: { label: 'Admin', icon: Shield, tone: 'bg-amber-50 text-amber-700 ring-amber-200/70' },
  SECURITY: { label: 'Keamanan', icon: AlertTriangle, tone: 'bg-red-50 text-red-700 ring-red-200/70' },
  SYSTEM: { label: 'Sistem', icon: Sparkles, tone: 'bg-surface-100 text-surface-700 ring-surface-200/70' },
}

const severityConfig: Record<ActivitySeverity, { label: string; variant: 'default' | 'success' | 'warning' | 'danger'; icon: typeof CheckCircle }> = {
  INFO: { label: 'Info', variant: 'default', icon: Clock },
  SUCCESS: { label: 'Sukses', variant: 'success', icon: CheckCircle },
  WARNING: { label: 'Warning', variant: 'warning', icon: AlertTriangle },
  CRITICAL: { label: 'Critical', variant: 'danger', icon: AlertCircle },
}

const CATEGORY_FILTERS: Array<{ id: 'all' | ActivityCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'AUTH', label: 'Auth' },
  { id: 'ACCOUNT', label: 'Akun' },
  { id: 'ORDER', label: 'Order' },
  { id: 'PAYMENT', label: 'Payment' },
  { id: 'COMMUNICATION', label: 'Komunikasi' },
  { id: 'ADMIN', label: 'Admin' },
  { id: 'SECURITY', label: 'Keamanan' },
  { id: 'SYSTEM', label: 'Sistem' },
]

const SEVERITY_FILTERS: Array<{ id: 'all' | ActivitySeverity; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'INFO', label: 'Info' },
  { id: 'SUCCESS', label: 'Sukses' },
  { id: 'WARNING', label: 'Warning' },
  { id: 'CRITICAL', label: 'Critical' },
]

function formatLogTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function AdminLogsView() {
  const { period } = useDashboardPeriod()
  const [items, setItems] = useState<LogItem[]>([])
  const [stats, setStats] = useState<LogStats>({ total: 0, totalToday: 0, totalWeek: 0, warnings24h: 0, criticals24h: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | ActivityCategory>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | ActivitySeverity>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useSyncPeriodToDateInputs(period, setFrom, setTo)
  const [selectedItem, setSelectedItem] = useState<LogItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedQ(q), 250)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim())
      if (from) params.set('from', new Date(from).toISOString())
      if (to) params.set('to', new Date(`${to}T23:59:59`).toISOString())
      const res = await fetch(`/api/admin/logs?${params.toString()}`)
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat log')
        return
      }
      setItems(json.data.items)
      setStats(json.data.stats)
      setTotalItems(json.data.pagination?.total ?? json.data.stats?.total ?? 0)
    } catch {
      setError('Gagal memuat log aktivitas')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, severityFilter, debouncedQ, from, to, page, pageSize])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, severityFilter, debouncedQ, from, to, pageSize])

  const categoryOptions = useMemo(
    () => CATEGORY_FILTERS.map((f) => ({ value: f.id, label: f.label })),
    [],
  )
  const severityOptions = useMemo(
    () => SEVERITY_FILTERS.map((f) => ({ value: f.id, label: f.label })),
    [],
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Log Aktivitas</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Audit trail seluruh aktivitas platform — login, order, deposit, chat, dan keamanan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMonthFilter />
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Aktivitas hari ini"
          value={stats.totalToday.toLocaleString('id-ID')}
          icon={TrendingUp}
          footnote="24 jam terakhir"
          tone="primary"
          compact
        />
        <MetricCard
          title="Minggu ini"
          value={stats.totalWeek.toLocaleString('id-ID')}
          icon={History}
          footnote="7 hari terakhir"
          tone="neutral"
          compact
        />
        <MetricCard
          title="Warning 24h"
          value={stats.warnings24h.toLocaleString('id-ID')}
          icon={AlertTriangle}
          footnote="Perlu perhatian"
          tone={stats.warnings24h > 0 ? 'warning' : 'neutral'}
          compact
        />
        <MetricCard
          title="Critical 24h"
          value={stats.criticals24h.toLocaleString('id-ID')}
          icon={AlertCircle}
          footnote="Aktivitas mencurigakan"
          tone={stats.criticals24h > 0 ? 'danger' : 'neutral'}
          compact
        />
      </div>

      {/* Critical alert banner */}
      {stats.criticals24h > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 shadow-soft-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">
              {stats.criticals24h} aktivitas mencurigakan terdeteksi dalam 24 jam terakhir
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              Periksa log dengan severity &quot;Critical&quot; untuk detail percobaan brute-force atau akses tidak sah.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => { setSeverityFilter('CRITICAL'); setCategoryFilter('all') }}
          >
            Lihat
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, email, aksi, atau target..."
            className="flex-1 lg:min-w-[200px] lg:max-w-md"
            inputClassName="h-9 text-xs"
          />
          <CategoryFilterDropdown
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
            options={categoryOptions}
            className="w-full sm:w-auto"
          />
          <CategoryFilterDropdown
            value={severityFilter}
            onChange={(v) => setSeverityFilter(v as typeof severityFilter)}
            options={severityOptions}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
          <Button size="sm" variant="outline" className="mt-2" onClick={() => void load()}>Coba lagi</Button>
        </div>
      )}

      {/* List */}
      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `Total ${totalItems.toLocaleString('id-ID')} log`}
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="shadow-soft-xs">
          <CardContent className="p-8 text-center">
            <History className="mx-auto mb-3 h-8 w-8 text-surface-400" />
            <p className="text-sm font-semibold text-ink">Belum ada log</p>
            <p className="mt-1 text-xs text-surface-500">
              Aktivitas platform akan tercatat secara otomatis di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <LogCard key={item.id} item={item} idx={idx} onSelect={setSelectedItem} />
          ))}
        </div>
      )}

      {!loading && totalItems > 0 && (
        <DataPagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}

      {/* Detail drawer */}
      <LogDetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}


function LogCard({ item, idx, onSelect }: { item: LogItem; idx: number; onSelect: (item: LogItem) => void }) {
  const cat = categoryConfig[item.category]
  const sev = severityConfig[item.severity]
  const CatIcon = cat.icon
  const SevIcon = sev.icon

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02, duration: 0.25 }}
      onClick={() => onSelect(item)}
      className={cn(
        'group/log w-full text-left rounded-2xl border bg-white p-4 shadow-soft-xs transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary-200/70 hover:shadow-soft-md',
        item.severity === 'CRITICAL' && 'border-red-200/70 bg-red-50/30',
        item.severity === 'WARNING' && 'border-amber-200/50',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', cat.tone)}>
          <CatIcon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
              {cat.label}
            </span>
            <Badge variant={sev.variant} className="px-2 py-0.5 text-[10px]">
              <SevIcon className="h-3 w-3" />
              {sev.label}
            </Badge>
            {item.actorRole && (
              <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                {item.actorRole}
              </Badge>
            )}
            <span className="ml-auto text-[10px] tabular-nums text-surface-500">
              {formatLogTime(item.createdAt)}
            </span>
          </div>

          <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink">
            {item.summary}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-surface-500">
            {item.actorName && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {item.actorName}
              </span>
            )}
            {item.actorEmail && !item.actorName && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {item.actorEmail}
              </span>
            )}
            {item.targetLabel && (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {item.targetLabel}
              </span>
            )}
            {item.ip && (
              <span className="font-mono">{item.ip}</span>
            )}
          </div>
        </div>

        <Eye className="h-4 w-4 flex-shrink-0 text-surface-400 opacity-0 transition-opacity group-hover/log:opacity-100" />
      </div>
    </motion.button>
  )
}

function LogDetailDrawer({ item, onClose }: { item: LogItem | null; onClose: () => void }) {
  const chronology = item
    ? buildActivityLogChronology({
        action: item.action,
        category: item.category,
        severity: item.severity,
        summary: item.summary,
        detail: item.detail,
        actorName: item.actorName,
        actorEmail: item.actorEmail,
        actorRole: item.actorRole,
        ip: item.ip,
        metadata: item.metadata,
        createdAt: item.createdAt,
      })
    : null

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: '100%', opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.4 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-surface-200/70 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-surface-200/70 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-surface-500">
                  Detail Log
                </p>
                <h2 className="truncate text-base font-semibold text-ink">{item.action}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Severity + Category */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={severityConfig[item.severity].variant} className="px-2.5 py-1 text-[11px]">
                  {React.createElement(severityConfig[item.severity].icon, { className: 'h-3 w-3' })}
                  {severityConfig[item.severity].label}
                </Badge>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset', categoryConfig[item.category].tone)}>
                  {React.createElement(categoryConfig[item.category].icon, { className: 'h-3 w-3' })}
                  {categoryConfig[item.category].label}
                </span>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Ringkasan</p>
                <p className="text-[13px] leading-relaxed text-ink">{item.summary}</p>
              </div>

              {/* Chronology */}
              {chronology && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">Kronologi</p>
                  <p className="text-[13px] leading-relaxed text-amber-950">{chronology}</p>
                </div>
              )}

              {/* Detail */}
              {item.detail && (
                <div className="rounded-2xl border border-surface-200/70 bg-surface-50/60 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Detail</p>
                  <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink">{item.detail}</p>
                </div>
              )}

              {/* Actor */}
              <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Aktor</p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                  <dt className="text-surface-500">Nama</dt>
                  <dd className="font-semibold text-ink">{item.actorName ?? '—'}</dd>
                  <dt className="text-surface-500">Email</dt>
                  <dd className="font-semibold text-ink">{item.actorEmail ?? '—'}</dd>
                  <dt className="text-surface-500">Role</dt>
                  <dd className="font-semibold text-ink">{item.actorRole ?? '—'}</dd>
                </dl>
              </div>

              {/* Target */}
              {(item.targetType || item.targetId || item.targetLabel) && (
                <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Target</p>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                    <dt className="text-surface-500">Tipe</dt>
                    <dd className="font-semibold text-ink">{item.targetType ?? '—'}</dd>
                    <dt className="text-surface-500">ID</dt>
                    <dd className="font-mono font-semibold text-ink">{item.targetId ?? '—'}</dd>
                    <dt className="text-surface-500">Label</dt>
                    <dd className="font-semibold text-ink">{item.targetLabel ?? '—'}</dd>
                  </dl>
                </div>
              )}

              {/* Request context */}
              <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Konteks Request</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[12px]">
                  <dt className="text-surface-500">Waktu</dt>
                  <dd className="font-semibold text-ink">{new Date(item.createdAt).toLocaleString('id-ID')}</dd>
                  <dt className="text-surface-500">IP</dt>
                  <dd className="font-mono font-semibold text-ink">{item.ip ?? '—'}</dd>
                  <dt className="text-surface-500">User-Agent</dt>
                  <dd className="break-all text-[11px] text-surface-700">{item.userAgent ?? '—'}</dd>
                  <dt className="text-surface-500">Action code</dt>
                  <dd className="font-mono font-semibold text-ink">{item.action}</dd>
                </dl>
              </div>

              {/* Metadata */}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="rounded-2xl border border-surface-200/70 bg-surface-50/60 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Metadata</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-[11px] text-ink shadow-soft-xs">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// Need React for createElement in drawer
import React from 'react'
