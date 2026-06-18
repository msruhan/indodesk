'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SupportTicketDetailDto } from '@/lib/support-ticket-serializer'
import {
  SupportTicketCategoryLabel,
  SupportTicketPriorityBadge,
  SupportTicketStatusBadge,
  formatTicketDate,
} from './support-ticket-shared'
import { RefreshCw } from '@/lib/icons'
import type { SupportTicketBasePath } from '@/lib/support-ticket-constants'
import { supportTicketListHref, supportTicketBackLabel } from '@/lib/support-ticket-constants'
import { cn } from '@/lib/utils'

type Props = {
  ticketId: string
  basePath: SupportTicketBasePath
}

export function SupportTicketDetailPage({ ticketId, basePath }: Props) {
  const [ticket, setTicket] = useState<SupportTicketDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat tiket')
        return
      }
      setTicket(json.data)
    } catch {
      setError('Gagal memuat tiket')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    void load()
  }, [load])

  const sendReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    setError(null)
    try {
      const form = new FormData()
      form.set('body', reply.trim())
      for (const file of files) form.append('attachments', file)
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: form,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengirim balasan')
        return
      }
      setReply('')
      setFiles([])
      await load()
    } catch {
      setError('Gagal mengirim balasan')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className="text-sm text-surface-500">Memuat…</p>
  if (error && !ticket) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-rose-600">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }
  if (!ticket) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={supportTicketListHref(basePath)} className="text-xs text-primary-600 hover:underline">
            {supportTicketBackLabel(basePath)}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-surface-500">{ticket.publicId}</span>
            <SupportTicketStatusBadge status={ticket.status} />
            <SupportTicketPriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="mt-2 text-xl font-semibold text-ink">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-surface-500">
            <SupportTicketCategoryLabel category={ticket.category} />
            {ticket.relatedLabel ? ` · ${ticket.relatedLabel}` : ''}
            {' · '}Dibuat {formatTicketDate(ticket.createdAt)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {ticket.status === 'RESOLVED' && (
        <div className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-600">
          Tiket ini sudah ditutup. Jika masalah belum terselesaikan, buat tiket baru.
          <Button asChild size="sm" variant="outline" className="ml-3 mt-2 sm:mt-0">
            <Link href={`${basePath}/new?previousTicketId=${ticket.id}`}>Buat tiket lanjutan</Link>
          </Button>
        </div>
      )}

      {ticket.previousTicketPublicId && (
        <p className="text-xs text-surface-500">
          Lanjutan dari tiket:{' '}
          <span className="font-mono">{ticket.previousTicketPublicId}</span>
        </p>
      )}

      {ticket.relatedSnapshot != null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Konteks layanan</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-48 overflow-auto rounded-lg bg-surface-50 p-3 text-[11px] text-surface-700">
              {JSON.stringify(ticket.relatedSnapshot, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Percakapan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-3">
            <p className="text-xs font-semibold text-surface-500">Deskripsi awal</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{ticket.description}</p>
            {ticket.media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.media.map((m) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary-600 underline"
                  >
                    {m.fileName}
                  </a>
                ))}
              </div>
            )}
          </div>

          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'rounded-xl border p-3',
                msg.authorRole === 'ADMIN'
                  ? 'border-primary-100 bg-primary-50/40'
                  : 'border-surface-100 bg-white',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink">
                  {msg.authorName}{' '}
                  <span className="font-normal text-surface-500">({msg.authorRole})</span>
                </p>
                <p className="text-[10px] text-surface-400">{formatTicketDate(msg.createdAt)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{msg.body}</p>
              {msg.media.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.media.map((m) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary-600 underline"
                    >
                      {m.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {ticket.canReply && (
            <div className="space-y-2 border-t border-surface-100 pt-4">
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <textarea
                className="min-h-[88px] w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Tulis balasan…"
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
                className="block text-xs text-surface-500"
              />
              <Button size="sm" disabled={sending || !reply.trim()} onClick={() => void sendReply()}>
                {sending ? 'Mengirim…' : 'Kirim balasan'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
