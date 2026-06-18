'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardMonthFilter, MetricCard } from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import { cn } from '@/lib/utils'
import {
  formatMonitoringTime,
  type MonitoringActivityItem,
  type MonitoringChannel,
  type MonitoringDetailDto,
  type MonitoringPartyDto,
  type MonitoringStats,
} from '@/lib/admin-monitoring'
import {
  CheckCircle,
  Clock,
  Eye,
  Laptop,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  Users,
  Wrench,
  X,
  XCircle,
} from '@/lib/icons'

/** Interval refresh monitoring (selaras dengan chat messenger). */
const MONITORING_POLL_MS = 5000

const emptyStats: MonitoringStats = {
  totalChat: 0,
  totalKonsultasi: 0,
  totalRemote: 0,
  liveSessions: 0,
  pendingSessions: 0,
  unreadMessages: 0,
  totalParticipants: 0,
  activeToday: 0,
}

type TabKey = 'all' | 'chat' | 'konsultasi' | 'remote'

const tabConfig: Array<{ key: TabKey; label: string; icon: typeof MessageCircle; description: string }> = [
  { key: 'all', label: 'Semua', icon: Sparkles, description: 'Gabungan seluruh aktivitas user dan teknisi' },
  { key: 'chat', label: 'Chat', icon: MessageSquare, description: 'Percakapan teks antara user dan teknisi' },
  { key: 'konsultasi', label: 'Konsultasi', icon: MessageCircle, description: 'Sesi konsultasi berbayar antara user dan teknisi' },
  { key: 'remote', label: 'Remote', icon: Laptop, description: 'Sesi remote support melalui IndoDesk' },
]

const channelIcon: Record<MonitoringChannel, typeof MessageCircle> = {
  chat: MessageSquare,
  konsultasi: MessageCircle,
  remote: Laptop,
}

const channelTone: Record<
  MonitoringChannel,
  { wrapper: string; icon: string; label: string }
> = {
  chat: { wrapper: 'bg-accent-50 ring-accent-200/70', icon: 'text-accent-700', label: 'Chat' },
  konsultasi: { wrapper: 'bg-primary-50 ring-primary-200/70', icon: 'text-primary-700', label: 'Konsultasi' },
  remote: { wrapper: 'bg-amber-50 ring-amber-200/70', icon: 'text-amber-700', label: 'Remote' },
}

function statusVariant(tone: MonitoringActivityItem['statusTone']): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  return tone
}

function statusIcon(tone: MonitoringActivityItem['statusTone']) {
  if (tone === 'success') return CheckCircle
  if (tone === 'danger') return XCircle
  if (tone === 'warning') return Clock
  return Sparkles
}

function avatarOf(party: MonitoringPartyDto): string {
  if (party.image) return party.image
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(party.name)}&background=0d9488&color=fff&size=128`
}

function ActivityCard({
  item,
  onOpen,
  active,
}: {
  item: MonitoringActivityItem
  onOpen: (item: MonitoringActivityItem) => void
  active: boolean
}) {
  const Icon = channelIcon[item.channel]
  const StatusIcon = statusIcon(item.statusTone)
  const tone = channelTone[item.channel]

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onOpen(item)}
      className={cn(
        'group/item w-full text-left rounded-2xl border bg-white p-4 shadow-soft-xs transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary-200/70 hover:shadow-soft-md',
        active ? 'border-primary-300 ring-2 ring-primary-200/60 shadow-soft-md' : 'border-surface-200/70',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            tone.wrapper,
          )}
        >
          <Icon className={cn('h-[18px] w-[18px]', tone.icon)} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
              {tone.label}
            </span>
            {item.subject && (
              <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-600">
                {item.subject}
              </span>
            )}
            <Badge variant={statusVariant(item.statusTone)} className="px-2 py-0.5 text-[10px]">
              <StatusIcon className="h-3 w-3" />
              {item.statusLabel}
            </Badge>
            <span className="ml-auto text-[10px] text-surface-500">{item.timeLabel}</span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <PartyChip party={item.user} />
            <span className="text-surface-400">↔</span>
            <PartyChip party={item.teknisi} accent />
          </div>

          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-surface-600">{item.summary}</p>

          {item.meta.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-surface-500">
              {item.meta.map((m) => (
                <span key={`${m.label}-${m.value}`} className="inline-flex items-center gap-1">
                  <span className="font-medium text-surface-600">{m.label}:</span>
                  <span className="font-semibold text-ink">{m.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <Eye className="h-4 w-4 flex-shrink-0 text-surface-400 opacity-0 transition-opacity group-hover/item:opacity-100" />
      </div>
    </motion.button>
  )
}

function PartyChip({ party, accent = false }: { party: MonitoringPartyDto; accent?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <img
        src={avatarOf(party)}
        alt={party.name}
        className={cn(
          'h-6 w-6 flex-shrink-0 rounded-full border object-cover',
          accent ? 'border-primary-200/70' : 'border-surface-200',
        )}
      />
      <span className="truncate text-[13px] font-semibold text-ink">{party.name}</span>
      {party.isOnline && (
        <span className="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-primary-500 ring-2 ring-white" aria-label="Online" />
      )}
    </span>
  )
}


function PartyDetailCard({
  party,
  role,
}: {
  party: MonitoringPartyDto
  role: 'User' | 'Teknisi'
}) {
  const tone = role === 'Teknisi' ? 'border-primary-200/70 bg-primary-50/40' : 'border-accent-200/70 bg-accent-50/40'
  return (
    <div className={cn('rounded-2xl border p-3 shadow-soft-xs', tone)}>
      <div className="mb-2 flex items-center gap-1.5">
        {role === 'Teknisi' ? (
          <Wrench className="h-3.5 w-3.5 text-primary-700" />
        ) : (
          <UserIcon className="h-3.5 w-3.5 text-accent-700" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-600">{role}</span>
        {party.isOnline !== undefined && (
          <Badge variant={party.isOnline ? 'success' : 'default'} className="ml-auto px-2 py-0 text-[9px]">
            {party.isOnline ? 'Online' : 'Offline'}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <img
          src={avatarOf(party)}
          alt={party.name}
          className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-soft-xs"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{party.name}</p>
          {party.email && (
            <p className="truncate text-[11px] text-surface-500">{party.email}</p>
          )}
        </div>
      </div>
      {party.phone && (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-surface-600">
          <Phone className="h-3 w-3" />
          {party.phone}
        </p>
      )}
    </div>
  )
}

function DetailDrawer({
  open,
  onClose,
  detail,
  loading,
  error,
}: {
  open: boolean
  onClose: () => void
  detail: MonitoringDetailDto | null
  loading: boolean
  error: string | null
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: '100%', opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.4 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-surface-200/70 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-surface-200/70 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-surface-500">
                  {detail?.activity.channelLabel ?? 'Detail Aktivitas'}
                </p>
                <h2 className="truncate text-base font-semibold text-ink">
                  {detail?.activity.subject ?? 'Memuat...'}
                </h2>
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

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading && (
                <div className="flex h-full items-center justify-center text-sm text-surface-500">
                  Memuat detail...
                </div>
              )}
              {error && !loading && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}
              {detail && !loading && !error && <DetailBody detail={detail} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DetailBody({ detail }: { detail: MonitoringDetailDto }) {
  const { activity } = detail
  const StatusIcon = statusIcon(activity.statusTone)

  return (
    <div className="space-y-4">
      {/* Header status */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant(activity.statusTone)} className="px-2.5 py-1 text-[11px]">
          <StatusIcon className="h-3 w-3" />
          {activity.statusLabel}
        </Badge>
        {activity.reference && (
          <span className="rounded-full bg-surface-100 px-2.5 py-1 font-mono text-[11px] text-surface-700">
            {activity.reference}
          </span>
        )}
        <span className="ml-auto text-[11px] text-surface-500">
          Diperbarui {activity.timeLabel}
        </span>
      </div>

      {/* Parties */}
      <div className="grid gap-3 sm:grid-cols-2">
        <PartyDetailCard party={activity.user} role="User" />
        <PartyDetailCard party={activity.teknisi} role="Teknisi" />
      </div>

      {/* Meta panel */}
      <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
          Informasi sesi
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <dt className="text-surface-500">Channel</dt>
          <dd className="font-semibold text-ink">{activity.channelLabel}</dd>
          <dt className="text-surface-500">Mulai</dt>
          <dd className="font-semibold text-ink">{formatMonitoringTime(activity.createdAt)}</dd>
          <dt className="text-surface-500">Aktivitas terbaru</dt>
          <dd className="font-semibold text-ink">{formatMonitoringTime(activity.updatedAt)}</dd>
          {activity.meta.map((m) => (
            <span key={`${m.label}-${m.value}`} className="contents">
              <dt className="text-surface-500">{m.label}</dt>
              <dd className="font-semibold text-ink">{m.value}</dd>
            </span>
          ))}
        </dl>
      </div>

      {/* Channel-specific bodies */}
      {activity.channel === 'chat' && detail.transcript && (
        <ChatTranscript detail={detail} />
      )}

      {activity.channel === 'konsultasi' && detail.konsultasi && (
        <KonsultasiPanel detail={detail} />
      )}

      {activity.channel === 'remote' && detail.remote && (
        <RemotePanel detail={detail} />
      )}
    </div>
  )
}

function ChatTranscript({ detail }: { detail: MonitoringDetailDto }) {
  const transcript = detail.transcript ?? []
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [transcript.length, transcript[transcript.length - 1]?.id])

  return (
    <div className="rounded-2xl border border-surface-200/70 bg-surface-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
          Transkrip percakapan
        </p>
        <span className="text-[10px] text-surface-500">{transcript.length} pesan</span>
      </div>

      {transcript.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-surface-500">
          Belum ada pesan dalam percakapan ini.
        </p>
      ) : (
        <div className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto px-1">
          {transcript.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex w-full',
                msg.isFromUser ? 'justify-start' : 'justify-end',
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-[12.5px] shadow-soft-xs',
                  msg.isFromUser
                    ? 'rounded-tl-sm border border-surface-200/70 bg-white text-ink'
                    : 'rounded-tr-sm bg-primary-600 text-white',
                )}
              >
                <p className={cn(
                  'mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
                  msg.isFromUser ? 'text-surface-500' : 'text-primary-100',
                )}>
                  {msg.senderName} · {msg.senderRole === 'USER' ? 'User' : msg.senderRole === 'TEKNISI' ? 'Teknisi' : 'Admin'}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                <p className={cn(
                  'mt-1 text-right text-[10px]',
                  msg.isFromUser ? 'text-surface-400' : 'text-primary-100/80',
                )}>
                  {msg.timeLabel}
                  {msg.read && msg.isFromUser ? '' : msg.read ? ' · dibaca' : ''}
                </p>
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      )}
    </div>
  )
}

function KonsultasiPanel({ detail }: { detail: MonitoringDetailDto }) {
  const k = detail.konsultasi
  if (!k) return null
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-primary-200/60 bg-primary-50/30 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700">
          Detail konsultasi
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <dt className="text-surface-500">Biaya</dt>
          <dd className="font-semibold text-ink">{k.price}</dd>
          <dt className="text-surface-500">Mulai sesi</dt>
          <dd className="font-semibold text-ink">{formatMonitoringTime(k.startedAt)}</dd>
          <dt className="text-surface-500">Berakhir</dt>
          <dd className="font-semibold text-ink">{formatMonitoringTime(k.endedAt)}</dd>
          <dt className="text-surface-500">Durasi sesi</dt>
          <dd className="font-semibold text-ink">{k.durasi ?? '—'}</dd>
          <dt className="text-surface-500">Rating</dt>
          <dd className="font-semibold text-ink">{k.rating ? `${k.rating} / 5` : 'Belum dirating'}</dd>
        </dl>
      </div>
      {k.review && (
        <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
            Review user
          </p>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{k.review}</p>
        </div>
      )}
    </div>
  )
}

function RemotePanel({ detail }: { detail: MonitoringDetailDto }) {
  const r = detail.remote
  if (!r) return null
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-3">
        <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
          <Shield className="h-3 w-3" />
          Sesi remote IndoDesk
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <dt className="text-surface-500">Remote ID</dt>
          <dd className="font-mono font-semibold text-ink">{r.remoteId}</dd>
          <dt className="text-surface-500">Platform</dt>
          <dd className="font-semibold text-ink">{r.platform ?? '—'}</dd>
          <dt className="text-surface-500">Diterima</dt>
          <dd className="font-semibold text-ink">{formatMonitoringTime(r.acceptedAt)}</dd>
          <dt className="text-surface-500">Selesai</dt>
          <dd className="font-semibold text-ink">{formatMonitoringTime(r.completedAt)}</dd>
          <dt className="text-surface-500">Durasi</dt>
          <dd className="font-semibold text-ink">{r.durasi ?? '—'}</dd>
        </dl>
      </div>
      {r.description && (
        <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
            Deskripsi permintaan
          </p>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{r.description}</p>
        </div>
      )}
    </div>
  )
}


export function AdminMonitoringView() {
  const { period } = useDashboardPeriod()
  const [tab, setTab] = useState<TabKey>('all')
  const [items, setItems] = useState<MonitoringActivityItem[]>([])
  const [stats, setStats] = useState<MonitoringStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [openDetailId, setOpenDetailId] = useState<string | null>(null)
  const [openChannel, setOpenChannel] = useState<MonitoringChannel | null>(null)
  const [detail, setDetail] = useState<MonitoringDetailDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const detailRequestRef = useRef(0)

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 250)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [search])

  const loadList = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const params = new URLSearchParams()
      if (tab !== 'all') params.set('tab', tab)
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim())
      const res = await fetch(`/api/admin/monitoring?${params.toString()}`)
      const data = await res.json()
      if (!data.success) {
        if (!silent) setError(data.error || 'Gagal memuat data monitoring')
        return
      }
      setItems(data.data.items)
      setStats(data.data.stats)
      if (!silent) setError(null)
    } catch {
      if (!silent) setError('Gagal memuat data monitoring')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [tab, debouncedSearch])

  const loadDetail = useCallback(
    async (channel: MonitoringChannel, id: string, silent = false) => {
      const requestId = ++detailRequestRef.current
      if (!silent) {
        setDetailLoading(true)
        setDetailError(null)
      }
      try {
        const res = await fetch(`/api/admin/monitoring/${channel}/${id}`)
        const data = await res.json()
        if (requestId !== detailRequestRef.current) return
        if (!data.success) {
          if (!silent) setDetailError(data.error || 'Gagal memuat detail')
          return
        }
        setDetail(data.data)
        if (!silent) setDetailError(null)
      } catch {
        if (requestId !== detailRequestRef.current) return
        if (!silent) setDetailError('Gagal memuat detail')
      } finally {
        if (!silent && requestId === detailRequestRef.current) {
          setDetailLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void loadList(true)
    }, MONITORING_POLL_MS)
    return () => clearInterval(interval)
  }, [loadList])

  useEffect(() => {
    if (!openDetailId || !openChannel) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void loadDetail(openChannel, openDetailId, true)
    }, MONITORING_POLL_MS)
    return () => clearInterval(interval)
  }, [openDetailId, openChannel, loadDetail])

  const handleOpen = useCallback(
    async (item: MonitoringActivityItem) => {
      setOpenDetailId(item.id)
      setOpenChannel(item.channel)
      setDetail(null)
      await loadDetail(item.channel, item.id, false)
    },
    [loadDetail],
  )

  const handleClose = useCallback(() => {
    detailRequestRef.current += 1
    setOpenDetailId(null)
    setOpenChannel(null)
    setDetail(null)
    setDetailError(null)
  }, [])

  const periodItems = useMemo(
    () => items.filter((i) => isDateInPeriod(i.updatedAt, period)),
    [items, period],
  )

  const filteredItems = useMemo(() => {
    if (tab === 'all') return periodItems
    return periodItems.filter((i) => i.channel === tab)
  }, [periodItems, tab])

  const counts = useMemo(() => {
    const result: Record<TabKey, number> = { all: periodItems.length, chat: 0, konsultasi: 0, remote: 0 }
    for (const i of periodItems) {
      result[i.channel] += 1
    }
    return result
  }, [periodItems])

  const tabDescription = tabConfig.find((t) => t.key === tab)?.description ?? ''

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Monitoring</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Pantau seluruh aktivitas dan komunikasi antara user dan teknisi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMonthFilter />
          <Button variant="outline" size="sm" className="h-9" onClick={() => void loadList(false)} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Live Sessions"
          value={stats.liveSessions.toLocaleString('id-ID')}
          icon={TrendingUp}
          footnote={`${stats.pendingSessions} menunggu aksi`}
          tone="primary"
          compact
        />
        <MetricCard
          title="Pesan belum dibaca"
          value={stats.unreadMessages.toLocaleString('id-ID')}
          icon={MessageSquare}
          footnote="Di seluruh percakapan chat"
          tone={stats.unreadMessages > 0 ? 'warning' : 'primary'}
          compact
        />
        <MetricCard
          title="Aktif hari ini"
          value={stats.activeToday.toLocaleString('id-ID')}
          icon={Sparkles}
          footnote="Chat, konsultasi, dan remote"
          tone="primary"
          compact
        />
        <MetricCard
          title="Pengguna terlibat"
          value={stats.totalParticipants.toLocaleString('id-ID')}
          icon={Users}
          footnote="User dan teknisi yang ber-chat"
          tone="neutral"
          compact
        />
      </div>

      {/* Channel breakdown chips */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ChannelTotalChip channel="chat" total={stats.totalChat} />
        <ChannelTotalChip channel="konsultasi" total={stats.totalKonsultasi} />
        <ChannelTotalChip channel="remote" total={stats.totalRemote} />
      </div>

      {/* Tabs + Search */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
              {tabConfig.map((t) => (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className="group/mtab shrink-0 px-3 text-xs sm:px-4"
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-100 px-1 text-[9px] font-semibold text-surface-600 group-data-[state=active]/mtab:bg-white/20 group-data-[state=active]/mtab:text-white">
                    {counts[t.key]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <SearchInput
            placeholder="Cari user, teknisi, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>

        <p className="mt-1 text-[11px] text-surface-500">{tabDescription}</p>

        {tabConfig.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <ActivityList
              items={filteredItems}
              loading={loading}
              error={error}
              onOpen={handleOpen}
              activeId={openDetailId}
              onRetry={() => void loadList(false)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <DetailDrawer
        open={openDetailId !== null && openChannel !== null}
        onClose={handleClose}
        detail={detail}
        loading={detailLoading}
        error={detailError}
      />
    </div>
  )
}

function ChannelTotalChip({ channel, total }: { channel: MonitoringChannel; total: number }) {
  const Icon = channelIcon[channel]
  const tone = channelTone[channel]
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
      <span className={cn('inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tone.wrapper)}>
        <Icon className={cn('h-4 w-4', tone.icon)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-surface-500">Total {tone.label}</p>
        <p className="text-lg font-bold text-ink tabular-nums">{total.toLocaleString('id-ID')}</p>
      </div>
    </div>
  )
}

function ActivityList({
  items,
  loading,
  error,
  onOpen,
  activeId,
  onRetry,
}: {
  items: MonitoringActivityItem[]
  loading: boolean
  error: string | null
  onOpen: (item: MonitoringActivityItem) => void
  activeId: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-100/50"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
        <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
          Coba lagi
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="shadow-soft-xs">
        <CardContent className="p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-surface-400" />
          <p className="text-sm font-semibold text-ink">Belum ada aktivitas</p>
          <p className="mt-1 text-xs text-surface-500">
            Setiap chat, konsultasi, dan remote support akan muncul di sini secara realtime.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-2.5">
        {items.map((item) => (
          <ActivityCard
            key={`${item.channel}-${item.id}`}
            item={item}
            onOpen={onOpen}
            active={activeId === item.id}
          />
        ))}
      </div>
    </AnimatePresence>
  )
}
