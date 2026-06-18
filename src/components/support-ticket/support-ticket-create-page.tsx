'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  SUPPORT_TICKET_CATEGORY_OPTIONS,
  SUPPORT_TICKET_MAX_FILES,
  SUPPORT_TICKET_PRIORITY_OPTIONS,
  filterRelatedServicesForCategory,
  relatedServiceOptionKey,
  SUPPORT_TICKET_RELATED_TYPE_DEFAULT_CATEGORY,
  type SupportTicketBasePath,
  supportTicketListHref,
  supportTicketBackLabel,
} from '@/lib/support-ticket-constants'
import type { SupportTicketCategory, SupportTicketRelatedType } from '@prisma/client'
import type { RelatedServiceItem } from '@/lib/support-ticket-related-services'
import type { SupportTicketListItemDto } from '@/lib/support-ticket-serializer'
import { ArrowRight } from '@/lib/icons'

type Props = {
  basePath: SupportTicketBasePath
}

export function SupportTicketCreatePage({ basePath }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [relatedServices, setRelatedServices] = useState<RelatedServiceItem[]>([])
  const [resolvedTickets, setResolvedTickets] = useState<SupportTicketListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [category, setCategory] = useState<SupportTicketCategory>('SERVICE_ISSUE')
  const [priority, setPriority] = useState('NORMAL')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [relatedKey, setRelatedKey] = useState('')
  const [relatedManualNote, setRelatedManualNote] = useState('')
  const [previousTicketId, setPreviousTicketId] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const preRelatedType = searchParams.get('relatedType')
  const preRelatedId = searchParams.get('relatedId')
  const prePrevious = searchParams.get('previousTicketId')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [relatedRes, ticketsRes] = await Promise.all([
        fetch('/api/tickets/related-services'),
        fetch('/api/tickets'),
      ])
      const relatedJson = await relatedRes.json()
      const ticketsJson = await ticketsRes.json()
      if (relatedRes.ok && relatedJson.success) {
        setRelatedServices(relatedJson.data ?? [])
      }
      if (ticketsRes.ok && ticketsJson.success) {
        setResolvedTickets((ticketsJson.data ?? []).filter((t: SupportTicketListItemDto) => t.status === 'RESOLVED'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (prePrevious) setPreviousTicketId(prePrevious)
  }, [prePrevious])

  useEffect(() => {
    if (!relatedServices.length || !preRelatedType) return
    const relatedType = preRelatedType as SupportTicketRelatedType
    const defaultCategory = SUPPORT_TICKET_RELATED_TYPE_DEFAULT_CATEGORY[relatedType]
    if (defaultCategory) setCategory(defaultCategory)
    if (relatedType === 'OTHER') {
      setRelatedKey('OTHER')
      return
    }
    if (preRelatedId) {
      setRelatedKey(`${relatedType}:${preRelatedId}`)
    }
  }, [relatedServices, preRelatedType, preRelatedId])

  const filteredRelatedServices = useMemo(
    () => filterRelatedServicesForCategory(relatedServices, category),
    [relatedServices, category],
  )

  useEffect(() => {
    if (!relatedKey) return
    const stillValid = filteredRelatedServices.some(
      (item) => relatedServiceOptionKey(item) === relatedKey,
    )
    if (!stillValid) setRelatedKey('')
  }, [filteredRelatedServices, relatedKey])

  const selectedRelated = useMemo(() => {
    if (!relatedKey) return null
    if (relatedKey === 'OTHER') {
      return filteredRelatedServices.find((r) => r.type === 'OTHER') ?? null
    }
    const [type, id] = relatedKey.split(':')
    return filteredRelatedServices.find((r) => r.type === type && r.id === id) ?? null
  }, [relatedKey, filteredRelatedServices])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    setFiles(picked.slice(0, SUPPORT_TICKET_MAX_FILES))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const form = new FormData()
      form.set('category', category)
      form.set('priority', priority)
      form.set('subject', subject.trim())
      form.set('description', description.trim())
      if (selectedRelated?.type) {
        form.set('relatedType', selectedRelated.type)
        if (selectedRelated.id) form.set('relatedId', selectedRelated.id)
        if (selectedRelated.label) form.set('relatedLabel', selectedRelated.label)
      }
      if (selectedRelated?.type === 'OTHER' && relatedManualNote.trim()) {
        form.set('relatedManualNote', relatedManualNote.trim())
      }
      if (previousTicketId) form.set('previousTicketId', previousTicketId)
      for (const file of files) form.append('attachments', file)

      const res = await fetch('/api/tickets', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal membuat tiket')
        return
      }
      router.push(`${basePath}/${json.data.id}`)
    } catch {
      setError('Gagal membuat tiket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={supportTicketListHref(basePath)} className="text-xs text-primary-600 hover:underline">
          {supportTicketBackLabel(basePath)}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tightest text-ink">Buat Tiket</h1>
        <p className="mt-1 text-sm text-surface-500">
          Isi form di bawah sejelas mungkin agar admin dapat membantu lebih cepat.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form tiket</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-surface-500">Memuat…</p>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-ink">Kategori</span>
                  <select
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                  >
                    {SUPPORT_TICKET_CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-ink">Prioritas</span>
                  <select
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {SUPPORT_TICKET_PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink">Layanan terkait (opsional)</span>
                <select
                  className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                  value={relatedKey}
                  onChange={(e) => setRelatedKey(e.target.value)}
                >
                  <option value="">— Tidak terkait layanan —</option>
                  {filteredRelatedServices.map((item) => {
                    const key = relatedServiceOptionKey(item)
                    return (
                      <option key={key} value={key}>
                        {item.label}
                        {item.subtitle ? ` (${item.subtitle})` : ''}
                      </option>
                    )
                  })}
                </select>
              </label>

              {selectedRelated?.type === 'OTHER' && (
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-ink">Keterangan layanan manual</span>
                  <Input
                    value={relatedManualNote}
                    onChange={(e) => setRelatedManualNote(e.target.value)}
                    placeholder="Jelaskan layanan atau konteks masalah"
                  />
                </label>
              )}

              {resolvedTickets.length > 0 && (
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-ink">Tiket sebelumnya (opsional)</span>
                  <select
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                    value={previousTicketId}
                    onChange={(e) => setPreviousTicketId(e.target.value)}
                  >
                    <option value="">— Tidak ada —</option>
                    {resolvedTickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.publicId} — {t.subject}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink">Judul</span>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ringkas masalah Anda (min. 10 karakter)"
                  maxLength={120}
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink">Deskripsi</span>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan kendala secara detail (min. 30 karakter)"
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink">Lampiran (opsional, max {SUPPORT_TICKET_MAX_FILES})</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  multiple
                  onChange={onFileChange}
                  className="block w-full text-sm text-surface-600"
                />
                {files.length > 0 && (
                  <p className="text-xs text-surface-500">{files.length} file dipilih</p>
                )}
              </label>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Mengirim…' : 'Kirim tiket'}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
