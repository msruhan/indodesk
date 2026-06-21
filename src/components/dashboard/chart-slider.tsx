'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface ChartSliderProps {
  children: ReactNode[]
  className?: string
}

/**
 * A simple slider that shows one chart at a time with left/right navigation
 * and dot indicators. Swipe-friendly on mobile.
 */
export function ChartSlider({ children, className }: ChartSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = children.length

  const prev = () => setCurrent((c) => (c - 1 + total) % total)
  const next = () => setCurrent((c) => (c + 1) % total)

  return (
    <div className={cn('relative overflow-hidden px-7 sm:px-8', className)}>
      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-surface-200/70 bg-white/90 text-surface-600 shadow-soft-sm backdrop-blur-md transition-all hover:border-surface-300 hover:text-ink hover:shadow-soft-md sm:h-9 sm:w-9"
            aria-label="Chart sebelumnya"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-surface-200/70 bg-white/90 text-surface-600 shadow-soft-sm backdrop-blur-md transition-all hover:border-surface-300 hover:text-ink hover:shadow-soft-md sm:h-9 sm:w-9"
            aria-label="Chart berikutnya"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </>
      )}

      {/* Chart content */}
      <div className="overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 bg-gradient-to-r from-primary-500 to-accent-500'
                  : 'w-1.5 bg-surface-300 hover:bg-surface-400',
              )}
              aria-label={`Chart ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
