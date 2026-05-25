'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  getChecklistTemplate,
  type ChecklistItemResult,
  type ChecklistResult,
} from '@/lib/inspection-checklist'
import { InspectionPhotoUpload } from '@/components/inspection/inspection-photo-upload'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'
import type { InspectionDeviceCategory } from '@prisma/client'
import { Download } from '@/lib/icons'

export default function TeknisiInspeksiDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<InspectionOrderDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [checklist, setChecklist] = useState<ChecklistItemResult[]>([])
  const [overallCondition, setOverallCondition] = useState('GOOD')
  const [recommendation, setRecommendation] = useState('RECOMMENDED')
  const [findings, setFindings] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teknisi/inspeksi/${id}`)
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        const cat = data.data.category as InspectionDeviceCategory
        setChecklist(
          data.data.report?.checklist?.length
            ? data.data.report.checklist
            : getChecklistTemplate(cat),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const patch = async (body: object) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/teknisi/inspeksi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal')
        return
      }
      setOrder(data.data)
    } finally {
      setBusy(false)
    }
  }

  const updateChecklist = (key: string, field: 'result' | 'note', value: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: field === 'result' ? (value as ChecklistResult) : value,
            }
          : item,
      ),
    )
  }

  const submitReport = () => {
    void patch({
      action: 'submit_report',
      report: {
        overallCondition,
        recommendation,
        checklist,
        findings,
        suggestions,
        photoUrls,
      },
    })
  }

  if (loading) return <p className="text-sm text-surface-500">Memuat...</p>
  if (!order) return <p className="text-sm text-rose-600">Tidak ditemukan</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/teknisi/inspeksi" className="text-sm text-primary-700 hover:underline">
        ← Kembali
      </Link>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">{order.productName}</h1>
        <Badge>{order.statusLabel}</Badge>
      </div>

      <p className="text-sm text-surface-500">
        {order.orderCode} · {order.user?.name} · {order.modeLabel}
      </p>

      <Button asChild variant="outline" size="sm">
        <Link href={order.chatHref}>Chat pembeli</Link>
      </Button>

      {order.canAccept && (
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => void patch({ action: 'accept' })}>
            Terima
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => void patch({ action: 'reject' })}>
            Tolak
          </Button>
        </div>
      )}

      {order.canStart && (
        <Button disabled={busy} onClick={() => void patch({ action: 'start' })}>
          Mulai inspeksi
        </Button>
      )}

      {order.canSubmitReport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Form laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Kondisi keseluruhan</label>
                <select
                  value={overallCondition}
                  onChange={(e) => setOverallCondition(e.target.value)}
                  className="h-10 w-full rounded-xl border border-surface-200 px-3 text-sm"
                >
                  <option value="EXCELLENT">Sangat baik</option>
                  <option value="GOOD">Baik</option>
                  <option value="FAIR">Cukup</option>
                  <option value="POOR">Buruk</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Rekomendasi</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="h-10 w-full rounded-xl border border-surface-200 px-3 text-sm"
                >
                  <option value="RECOMMENDED">Layak beli</option>
                  <option value="NEGOTIATE">Negosiasi</option>
                  <option value="NOT_RECOMMENDED">Tidak disarankan</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.key} className="rounded-lg border border-surface-100 p-2">
                  <p className="text-xs font-medium">{item.label}</p>
                  <div className="mt-1 flex gap-2">
                    {(['pass', 'fail', 'unknown'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateChecklist(item.key, 'result', r)}
                        className={`rounded px-2 py-0.5 text-[10px] uppercase ${
                          item.result === r ? 'bg-primary-100 text-primary-800' : 'bg-surface-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <Input
                    className="mt-1 h-8 text-xs"
                    placeholder="Catatan"
                    value={item.note ?? ''}
                    onChange={(e) => updateChecklist(item.key, 'note', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Temuan *</label>
              <textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Saran</label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium">Foto unit</label>
              <InspectionPhotoUpload
                photoUrls={photoUrls}
                onChange={setPhotoUrls}
                disabled={busy}
              />
            </div>

            <Button disabled={busy} onClick={submitReport}>
              Kirim laporan
            </Button>
          </CardContent>
        </Card>
      )}

      {order.report && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Laporan terkirim</CardTitle>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/user/inspeksi/${id}/certificate`} download>
                  <Download className="h-4 w-4" />
                  PDF
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{order.report.recommendationLabel}</p>
            <p className="mt-2 whitespace-pre-line text-surface-600">{order.report.findings}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
