'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ProductImageEntry } from '@/lib/product-images'
import { ChevronLeft, ChevronRight, Shield, X } from '@/lib/icons'
import { cn } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  images: ProductImageEntry[]
  className?: string
  /** `embedded` = tanpa card wrapper, untuk di dalam detail card */
  variant?: 'card' | 'embedded'
}

export function Product3uToolsGallery({ images, className, variant = 'card' }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const urls = images.map((img) => img.url).filter(Boolean)
  if (urls.length === 0) return null

  const next = () => setActiveIndex((i) => (i + 1) % urls.length)
  const prev = () => setActiveIndex((i) => (i - 1 + urls.length) % urls.length)

  const gallery = (
    <>
      {variant === 'embedded' && (
        <div className="mb-3 flex items-center gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-surface-500">
            Bukti 3uTools
          </p>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden rounded-xl border border-surface-200/80 bg-surface-50"
          aria-label="Perbesar screenshot 3uTools"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              src={urls[activeIndex]}
              alt={`3uTools screenshot ${activeIndex + 1}`}
              className="h-full w-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>
          {urls.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-surface-700 shadow-sm ring-1 ring-surface-200/80">
              {activeIndex + 1}/{urls.length}
            </span>
          )}
        </button>

        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-surface-200/80 bg-white/95 text-surface-700 shadow-sm transition hover:bg-surface-50"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-surface-200/80 bg-white/95 text-surface-700 shadow-sm transition hover:bg-surface-50"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {urls.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {urls.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'h-10 flex-1 overflow-hidden rounded-lg border bg-surface-50 transition',
                activeIndex === idx
                  ? 'border-primary-400 ring-1 ring-primary-400/40'
                  : 'border-surface-200/80 opacity-70 hover:opacity-100',
              )}
              aria-label={`Screenshot ${idx + 1}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {variant === 'embedded' && (
        <p className="mt-2 text-[11px] leading-relaxed text-surface-500">
          Screenshot verifikasi hardware — baterai, layar, dan keaslian komponen.
        </p>
      )}
    </>
  )

  const lightbox = (
    <AnimatePresence>
      {lightboxOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot 3uTools"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxOpen(false)
            }}
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Berikutnya"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <motion.img
            key={activeIndex}
            src={urls[activeIndex]}
            alt={`3uTools ${activeIndex + 1}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease }}
            onClick={(e) => e.stopPropagation()}
          />

          <span className="absolute bottom-6 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            {activeIndex + 1} / {urls.length}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (variant === 'embedded') {
    return (
      <div className={className}>
        {gallery}
        {lightbox}
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'overflow-hidden rounded-[1.35rem] border border-surface-200/70 bg-white shadow-soft-xs',
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-primary-700 shadow-soft-xs">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-black">
              3uTools Report
            </span>
          </div>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-bold text-primary-700 ring-1 ring-primary-200/70">
            Verified
          </span>
        </div>
        <div className="mx-3 mb-2">{gallery}</div>
        <div className="border-t border-surface-200/70 bg-surface-50/60 px-4 py-2.5">
          <p className="text-[11px] leading-relaxed text-surface-600">
            Data hardware langsung dari 3uTools — baterai, layar, dan keaslian komponen terverifikasi.
          </p>
        </div>
      </div>
      {lightbox}
    </>
  )
}
