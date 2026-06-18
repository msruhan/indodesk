'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus } from '@/lib/icons'
import type { SupportTicketListItemDto } from '@/lib/support-ticket-serializer'
import {
  SupportTicketCategoryLabel,
  SupportTicketPriorityBadge,
  SupportTicketStatusBadge,
  formatTicketDate,
  supportTicketRowClass,
} from './support-ticket-shared'
import type { SupportTicketBasePath } from '@/lib/support-ticket-constants'
import { supportTicketListHref, supportTicketBackLabel } from '@/lib/support-ticket-constants'
import { cn } from '@/lib/utils'

type Filter = 'active' | 'resolved' | 'all'

export function SupportTicketListPage({
  basePath,
  embedded = false,
}: {
  basePath: SupportTicketBasePath
  embedded?: boolean
}) {
  const [items, setItems] = useState<SupportTicketListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('active')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tickets')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat tiket')
        return
      }
      setItems(json.data ?? [])
    } catch {
      setError('Gagal memuat tiket')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'resolved') return items.filter((i) => i.status === 'RESOLVED')
    if (filter === 'active') return items.filter((i) => i.status !== 'RESOLVED')
    return items
  }, [items, filter])

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-6'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {!embedded ? (
          <div>
            <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Support Tiket</h1>
            <p className="mt-1 text-sm text-surface-500">
              Laporkan gangguan layanan atau masalah platform ke tim admin.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-surface-600">
              Laporkan gangguan layanan atau masalah platform ke tim admin.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
          <Button asChild size="sm">
            <Link href={`${basePath}/new`}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Buat Tiket
            </Link>
          </Button>
        </div>
      </div>

      <div className="inline-flex rounded-full border border-surface-200 bg-white p-0.5">
        {(
          [
            ['active', 'Aktif'],
            ['resolved', 'Selesai'],
            ['all', 'Semua'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
              filter === key ? 'bg-primary-600 text-white' : 'text-surface-600 hover:text-primary-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-surface-500">Memuat…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 px-6 py-10 text-center">
          <p className="text-sm text-surface-600">Belum ada laporan kendala.</p>
          <p className="mt-1 text-xs text-surface-500">
            Ada masalah dengan layanan? Laporkan di sini agar admin dapat membantu.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href={`${basePath}/new`}>Buat tiket pertama</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Link key={item.id} href={`${basePath}/${item.id}`} className="block">
              <div className={supportTicketRowClass(false)}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-surface-500">{item.publicId}</span>
                      {item.reporterUnread && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                          Balasan baru
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-semibold text-ink">{item.subject}</p>
                    <p className="mt-0.5 text-xs text-surface-500">
                      <SupportTicketCategoryLabel category={item.category} />
                      {item.relatedLabel ? ` · ${item.relatedLabel}` : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <SupportTicketStatusBadge status={item.status} />
                    <SupportTicketPriorityBadge priority={item.priority} />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-surface-400">
                  Terakhir update {formatTicketDate(item.lastMessageAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
