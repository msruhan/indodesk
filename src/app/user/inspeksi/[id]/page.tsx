'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  InspectionRekberBundle,
  InspectionRekberLinked,
} from '@/components/inspection/inspection-rekber-bundle'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'
import { Download } from '@/lib/icons'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

export default function UserInspeksiDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<InspectionOrderDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [disputeReason, setDisputeReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/inspeksi/${id}`)
      const data = await res.json()
      if (data.success) setOrder(data.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const postAction = async (path: string, body?: object) => {
    setBusy(true)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
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

  if (loading) return <p className="text-sm text-surface-500">Memuat...</p>
  if (!order) return <p className="text-sm text-rose-600">Inspeksi tidak ditemukan</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/user/inspeksi" className="text-sm text-primary-700 hover:underline">
        ← Daftar inspeksi
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-surface-500">{order.orderCode}</p>
          <h1 className="text-xl font-semibold text-ink">{order.productName}</h1>
          <p className="text-sm text-surface-500">
            {order.modeLabel} · {order.categoryLabel}
          </p>
        </div>
        <Badge>{order.statusLabel}</Badge>
      </div>

      <Card>
        <CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-2">
          <p>
            <span className="text-surface-500">Teknisi:</span> {order.teknisi.name}
          </p>
          <p>
            <span className="text-surface-500">Biaya:</span> {formatPrice(order.price)}
          </p>
          <p>
            <span className="text-surface-500">Sumber:</span> {order.productSourceLabel}
          </p>
          {order.location && (
            <p>
              <span className="text-surface-500">Lokasi:</span> {order.location}
            </p>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href={order.chatHref}>Chat teknisi</Link>
      </Button>

      {order.report && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Laporan inspeksi</CardTitle>
                <p className="text-xs text-surface-500">Sertifikat: {order.report.certificateNumber}</p>
              </div>
              {order.canDownloadCertificate && (
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/user/inspeksi/${id}/certificate`} download>
                    <Download className="h-4 w-4" />
                    Unduh PDF
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Kondisi:</strong> {order.report.overallConditionLabel}
            </p>
            <p>
              <strong>Rekomendasi:</strong> {order.report.recommendationLabel}
            </p>
            <p className="whitespace-pre-line">{order.report.findings}</p>
            {order.report.suggestions && (
              <p className="text-surface-600">
                <strong>Saran:</strong> {order.report.suggestions}
              </p>
            )}
            <ul className="space-y-1 border-t border-surface-100 pt-3">
              {order.report.checklist.map((c) => (
                <li key={c.key} className="flex justify-between gap-2 text-xs">
                  <span>{c.label}</span>
                  <span className="font-medium uppercase">{c.result}</span>
                </li>
              ))}
            </ul>
            {order.report.photoUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
                {order.report.photoUrls.map((url, i) => (
                  <a
                    key={`${url}-${i}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-surface-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto inspeksi ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {order.rekber && (
        <InspectionRekberLinked
          orderCode={order.rekber.orderCode}
          statusLabel={order.rekber.statusLabel}
          href={order.rekber.href}
        />
      )}

      {order.canCreateRekber && (
        <InspectionRekberBundle
          inspectionId={order.id}
          productName={order.productName}
          teknisiName={order.teknisi.name}
          onCreated={setOrder}
        />
      )}

      {order.canConfirm && (
        <Card className="border-primary-200 bg-primary-50/30">
          <CardContent className="flex flex-wrap gap-2 p-4">
            <Button disabled={busy} onClick={() => void postAction(`/api/user/inspeksi/${id}/confirm`)}>
              Terima laporan & selesaikan
            </Button>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Alasan sengketa..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void postAction(`/api/user/inspeksi/${id}/dispute`, { reason: disputeReason })
                }
              >
                Ajukan sengketa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {order.canRate && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium">Beri rating teknisi</p>
            <Input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
              placeholder="Ulasan (opsional)"
            />
            <Button
              disabled={busy}
              onClick={() => void postAction(`/api/user/inspeksi/${id}/rate`, { rating, review })}
            >
              Kirim rating
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
