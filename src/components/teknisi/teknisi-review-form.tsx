'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Star, CheckCircle } from '@/lib/icons'
import type { TeknisiReviewDto } from '@/lib/teknisi-review'
import { TEKNISI_REVIEW_TAGS } from '@/lib/teknisi-review'

type TeknisiReviewFormProps = {
  teknisiId: string
  myReview: TeknisiReviewDto | null
  onSubmitted: () => void
}

export function TeknisiReviewForm({ teknisiId, myReview, onSubmitted }: TeknisiReviewFormProps) {
  const { data: session, status } = useSession()
  const [rating, setRating] = useState(myReview?.rating ?? 0)
  const [tag, setTag] = useState<string | null>(myReview?.tag ?? null)
  const [comment, setComment] = useState(myReview?.comment ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating)
      setTag(myReview.tag)
      setComment(myReview.comment)
    }
  }, [myReview])

  const isSelf = session?.user?.id === teknisiId
  const isLoggedIn = status === 'authenticated' && !!session?.user?.id

  if (isSelf) return null

  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/80 p-5 text-center text-sm text-surface-500">
        Memuat sesi…
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-surface-200/70 bg-white p-5 shadow-soft-xs">
        <p className="text-[13px] font-bold text-ink">Tulis ulasan & testimoni</p>
        <p className="mt-1 text-[11.5px] text-surface-500">
          Login untuk memberikan ulasan terverifikasi.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : `/teknisi/${teknisiId}`)}`}
            className="flex-1"
          >
            <Button variant="primary" size="default" className="w-full">
              Login
            </Button>
          </Link>
          <Link href="/register" className="flex-1">
            <Button variant="outline" size="default" className="w-full">
              Daftar
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const submit = async () => {
    if (rating < 1) {
      setError('Pilih rating bintang terlebih dahulu')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/teknisi/${teknisiId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, tag, comment }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengirim ulasan')
        return
      }
      setSuccess(myReview ? 'Ulasan diperbarui' : 'Terima kasih! Ulasan Anda telah dipublikasikan')
      onSubmitted()
    } catch {
      setError('Gagal mengirim ulasan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-xs sm:p-5">
      <p className="text-sm font-semibold text-ink">
        {myReview ? 'Perbarui ulasan Anda' : 'Tulis ulasan Anda'}
      </p>
      <p className="mt-0.5 text-[11px] text-surface-500">
        Masuk sebagai <span className="font-medium text-ink">{session.user?.name}</span>
      </p>

      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-surface-500">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="rounded-lg p-1 transition-transform hover:scale-110"
              aria-label={`${n} bintang`}
            >
              <Star
                className={cn(
                  'h-7 w-7',
                  n <= rating ? 'text-amber-500' : 'text-surface-300',
                )}
                weight={n <= rating ? 'fill' : 'duotone'}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-surface-500">Tag (opsional)</p>
        <div className="flex flex-wrap gap-1.5">
          {TEKNISI_REVIEW_TAGS.map((t) => (
            <button key={t} type="button" onClick={() => setTag(tag === t ? null : t)}>
              <Badge variant={tag === t ? 'primary' : 'outline'} className="cursor-pointer text-[10px]">
                {t}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-surface-500">
          Ulasan
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Ceritakan pengalaman Anda dengan teknisi ini…"
          className="w-full resize-none rounded-xl border border-surface-200/80 bg-surface-50/50 px-3 py-2.5 text-sm text-ink placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      {success && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary-700">
          <CheckCircle className="h-3.5 w-3.5" weight="fill" />
          {success}
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        size="sm"
        className="mt-4 w-full"
        disabled={submitting}
        onClick={() => void submit()}
      >
        {submitting ? 'Menyimpan…' : myReview ? 'Perbarui ulasan' : 'Kirim ulasan'}
      </Button>
    </div>
  )
}
