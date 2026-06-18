'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RefreshCw } from '@/lib/icons'
import type { SupportTicketAdminListItemDto, SupportTicketDetailDto } from '@/lib/support-ticket-serializer'
import {
  SUPPORT_TICKET_CATEGORY_OPTIONS,
  SUPPORT_TICKET_PRIORITY_OPTIONS,
} from '@/lib/support-ticket-constants'
import {
  SupportTicketCategoryLabel,
  SupportTicketPriorityBadge,
  SupportTicketStatusBadge,
  formatTicketDate,
  supportTicketRowClass,
} from '@/components/support-ticket/support-ticket-shared'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'new' | 'processing' | 'waiting' | 'resolved' | 'unread'

export function AdminSupportTicketsPanel() {
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id')

  const [items, setItems] = useState<SupportTicketAdminListItemDto[]>([])
  const [selected, setSelected] = useState<SupportTicketDetailDto | null>(null)
  const [tab, setTab] = useState<Tab>('unread')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [acting, setActing] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tickets?tab=${tab}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat tiket')
        return
      }
      setItems(json.data?.items ?? [])
    } catch {
      setError('Gagal memuat tiket')
    } finally {
      setLoading(false)
    }
  }, [tab])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setSelected(json.data)
      }
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (initialId) void loadDetail(initialId)
  }, [initialId, loadDetail])

  const selectTicket = (id: string) => {
    void loadDetail(id)
  }

  const patchTicket = async (payload: Record<string, unknown>) => {
    if (!selected) return
    setActing(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tickets/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memperbarui tiket')
        return
      }
      setSelected(json.data)
      await loadList()
    } catch {
      setError('Gagal memperbarui tiket')
    } finally {
      setActing(false)
    }
  }

  const sendMessage = async (isInternal: boolean) => {
    if (!selected) return
    const body = isInternal ? internalNote : reply
    if (!body.trim()) return
    setActing(true)
    setError(null)
    try {
      const form = new FormData()
      form.set('body', body.trim())
      form.set('isInternal', String(isInternal))
      for (const file of files) form.append('attachments', file)
      const res = await fetch(`/api/admin/tickets/${selected.id}/messages`, {
        method: 'POST',
        body: form,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengirim pesan')
        return
      }
      if (isInternal) setInternalNote('')
      else setReply('')
      setFiles([])
      await loadDetail(selected.id)
      await loadList()
    } catch {
      setError('Gagal mengirim pesan')
    } finally {
      setActing(false)
    }
  }

  const tabs = useMemo(
    () =>
      [
        ['unread', 'Belum dibaca'],
        ['new', 'Baru'],
        ['processing', 'Proses'],
        ['waiting', 'Menunggu pelapor'],
        ['resolved', 'Selesai'],
        ['all', 'Semua'],
      ] as const,
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Tiket Dukungan</h2>
          <p className="text-xs text-surface-500">Kelola laporan kendala dari user dan teknisi.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadList()} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      <div className="inline-flex flex-wrap rounded-full border border-surface-200 bg-white p-0.5">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
              tab === key ? 'bg-primary-600 text-white' : 'text-surface-600 hover:text-primary-700',
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

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          {loading ? (
            <p className="text-sm text-surface-500">Memuat…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-surface-500">Tidak ada tiket.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTicket(item.id)}
                className={cn('w-full text-left', supportTicketRowClass(selected?.id === item.id))}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-surface-500">{item.publicId}</span>
                  {item.adminUnread && <Badge variant="warning">Baru</Badge>}
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">{item.subject}</p>
                <p className="text-xs text-surface-500">
                  {item.reporterName} · {item.reporterRole}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <SupportTicketStatusBadge status={item.status} />
                  <SupportTicketPriorityBadge priority={item.priority} />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-surface-500">
                Pilih tiket untuk melihat detail.
              </CardContent>
            </Card>
          ) : detailLoading ? (
            <p className="text-sm text-surface-500">Memuat detail…</p>
          ) : (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-surface-500">{selected.publicId}</p>
                    <h3 className="text-lg font-semibold text-ink">{selected.subject}</h3>
                    <p className="text-xs text-surface-500">
                      {selected.reporter.name} ({selected.reporter.email}) · {selected.reporter.role}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <SupportTicketStatusBadge status={selected.status} />
                    <SupportTicketPriorityBadge priority={selected.priority} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-surface-200 px-2 py-1 text-xs"
                    value={selected.priority}
                    disabled={acting || selected.status === 'RESOLVED'}
                    onChange={(e) => void patchTicket({ priority: e.target.value })}
                  >
                    {SUPPORT_TICKET_PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {selected.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acting}
                      onClick={() => void patchTicket({ status: 'RESOLVED' })}
                    >
                      Tandai selesai
                    </Button>
                  )}
                </div>

                <div className="rounded-xl bg-surface-50 p-3 text-sm">
                  <p className="text-xs font-semibold text-surface-500">Kategori & layanan</p>
                  <p className="mt-1">
                    <SupportTicketCategoryLabel category={selected.category} />
                    {selected.relatedLabel ? ` · ${selected.relatedLabel}` : ''}
                  </p>
                  {selected.relatedManualNote && (
                    <p className="mt-1 text-xs text-surface-600">{selected.relatedManualNote}</p>
                  )}
                </div>

                {selected.relatedSnapshot != null && (
                  <pre className="max-h-36 overflow-auto rounded-lg bg-surface-50 p-2 text-[10px]">
                    {JSON.stringify(selected.relatedSnapshot, null, 2)}
                  </pre>
                )}

                <div className="space-y-3 border-t border-surface-100 pt-3">
                  <div className="rounded-xl border border-surface-100 p-3">
                    <p className="text-xs text-surface-500">Deskripsi awal · {formatTicketDate(selected.createdAt)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{selected.description}</p>
                  </div>

                  {selected.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'rounded-xl border p-3 text-sm',
                        msg.isInternal
                          ? 'border-amber-200 bg-amber-50/50'
                          : msg.authorRole === 'ADMIN'
                            ? 'border-primary-100 bg-primary-50/30'
                            : 'border-surface-100',
                      )}
                    >
                      <p className="text-xs font-semibold">
                        {msg.authorName} ({msg.authorRole})
                        {msg.isInternal ? ' · catatan internal' : ''}
                        <span className="ml-2 font-normal text-surface-400">
                          {formatTicketDate(msg.createdAt)}
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  ))}
                </div>

                {selected.status !== 'RESOLVED' && (
                  <div className="space-y-3 border-t border-surface-100 pt-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold text-ink">Balas ke pelapor</p>
                      <textarea
                        className="min-h-[80px] w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold text-amber-800">Catatan internal</p>
                      <Input
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Hanya terlihat admin"
                      />
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
                      className="block text-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={acting || !reply.trim()}
                        onClick={() => void sendMessage(false)}
                      >
                        Kirim balasan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting || !internalNote.trim()}
                        onClick={() => void sendMessage(true)}
                      >
                        Simpan catatan internal
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
