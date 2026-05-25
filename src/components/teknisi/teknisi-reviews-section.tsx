'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Star } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { PublicTeknisiDetailDto } from '@/lib/teknisi-public-detail'
import type { TeknisiReviewDto, TeknisiReviewStatsDto } from '@/lib/teknisi-review'
import { TEKNISI_REVIEW_TAGS } from '@/lib/teknisi-review'
import { TeknisiReviewForm } from '@/components/teknisi/teknisi-review-form'

const ease = [0.22, 1, 0.36, 1] as const

function AnimatedNumber({ value, decimal = false }: { value: number; decimal?: boolean }) {
  const text = decimal ? value.toFixed(1) : value.toLocaleString('id-ID')
  return <span className="tabular-nums">{text}</span>
}

type ReviewsPayload = {
  items: TeknisiReviewDto[]
  stats: TeknisiReviewStatsDto
  myReview: TeknisiReviewDto | null
}

type TeknisiReviewsSectionProps = {
  teknisi: PublicTeknisiDetailDto
}

export function TeknisiReviewsSection({ teknisi }: TeknisiReviewsSectionProps) {
  const [data, setData] = useState<ReviewsPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teknisi/${teknisi.id}/reviews`)
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json.data)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [teknisi.id])

  useEffect(() => {
    void load()
  }, [load])

  const stats = data?.stats ?? {
    averageRating: Number(teknisi.rating),
    reviewCount: teknisi.reviewCount,
    breakdown: [
      { stars: 5, percent: 0, count: 0 },
      { stars: 4, percent: 0, count: 0 },
      { stars: 3, percent: 0, count: 0 },
    ],
  }

  const items = data?.items ?? []
  const displayRating = stats.reviewCount > 0 ? stats.averageRating : Number(teknisi.rating)
  const displayCount = stats.reviewCount > 0 ? stats.reviewCount : teknisi.reviewCount

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-200/70 bg-gradient-to-br from-white via-white to-primary-50/20 shadow-soft-sm">
      {/* Subtle radial accent — same as Track Record */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />

      <div className="relative grid gap-0 lg:grid-cols-[280px_1fr]">
        {/* LEFT — Rating summary (no amber card, inline) */}
        <div className="relative border-b border-surface-200/70 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">Customer Voice</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-2xl">Reviews</h2>
            </div>
            <span className="hidden rounded-full border border-surface-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-surface-500 sm:inline-block">
              Verified
            </span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <p className="text-[72px] font-black leading-none tracking-tight text-ink sm:text-[88px]">
              <AnimatedNumber value={displayRating} decimal />
            </p>
            <div className="pb-2">
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0, rotate: -45 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.05, type: 'spring', stiffness: 240 }}
                  >
                    <Star className="h-4 w-4" weight="fill" />
                  </motion.span>
                ))}
              </div>
              <p className="mt-1 text-[11px] font-medium text-surface-600">
                <span className="font-bold tabular-nums text-ink">{displayCount}</span> verified reviews
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-surface-600">
            Rata-rata penilaian pelanggan setelah sesi diselesaikan. Hanya akun terverifikasi yang dapat memberi rating.
          </p>

          {/* Distribution bars — minimalist, same as Track Record */}
          <div className="mt-6 space-y-1.5">
            {stats.breakdown.map((row, idx) => (
              <div key={row.stars} className="flex items-center gap-2 text-[11px]">
                <span className="w-3 font-bold text-surface-700">{row.stars}</span>
                <Star className="h-2.5 w-2.5 text-amber-500" weight="fill" />
                <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-200/80">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${row.percent}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + idx * 0.08, duration: 0.9, ease }}
                    className="h-full rounded-full bg-ink"
                  />
                </div>
                <span className="w-8 text-right font-mono tabular-nums text-surface-500">{row.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Reviews list */}
        <div className="p-6 sm:p-8">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">Testimonials</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-400">
              {displayCount} total
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <TeknisiReviewForm
              teknisiId={teknisi.id}
              myReview={data?.myReview ?? null}
              onSubmitted={() => void load()}
            />

            <div className="flex flex-wrap gap-2">
              {TEKNISI_REVIEW_TAGS.map((tag, idx) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Badge variant="outline">{tag}</Badge>
                </motion.div>
              ))}
            </div>

            {loading && (
              <p className="py-6 text-center text-sm text-surface-500">Memuat ulasan…</p>
            )}

            {!loading && items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/80 py-10 text-center">
                <p className="text-sm font-medium text-ink">Belum ada ulasan</p>
                <p className="mt-1 text-xs text-surface-500">Jadilah yang pertama memberikan testimoni.</p>
              </div>
            )}

            <ul className="divide-y divide-surface-200/70">
              {items.map((review, idx) => (
                <motion.li
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: idx * 0.05 }}
                  className="group py-4 transition-colors hover:bg-primary-50/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {review.authorImage ? (
                        <img
                          src={review.authorImage}
                          alt=""
                          className="h-10 w-10 rounded-xl border border-white object-cover shadow-soft-xs"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-emerald-600 font-black text-white">
                          {review.authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-ink">{review.authorName}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/90 px-1.5 py-0.5 font-black uppercase tracking-[0.12em] text-amber-800">
                            <CheckCircle className="h-2.5 w-2.5 text-amber-600" weight="fill" />
                            Verified
                          </span>
                          {review.tag && (
                            <span className="text-surface-500">· {review.tag}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-ink">
                      <Star className="h-4 w-4 text-amber-500" weight="fill" />
                      {review.rating}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-surface-600">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <p className="mt-2 text-[10px] text-surface-400">{review.dateLabel}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
