'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '@/lib/pagination'

type PageSizeSelectProps = {
  value: PageSizeOption
  onChange: (size: PageSizeOption) => void
  options?: readonly PageSizeOption[]
  className?: string
  disabled?: boolean
}

export function PageSizeSelect({
  value,
  onChange,
  options = PAGE_SIZE_OPTIONS,
  className,
  disabled = false,
}: PageSizeSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const handleSelect = (size: PageSizeOption) => {
    onChange(size)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Jumlah baris per halaman"
        className={cn(
          'inline-flex h-8 min-w-[3.25rem] items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium tabular-nums transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-1',
          open
            ? 'border-primary-300 bg-primary-50 text-primary-800 shadow-soft-xs'
            : 'border-surface-200/70 bg-white text-surface-700 hover:border-primary-200/80 hover:bg-surface-50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span>{value}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-surface-400 transition-transform duration-200',
            open && 'rotate-180 text-primary-600',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Pilihan jumlah per halaman"
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[5.5rem] overflow-hidden rounded-xl border border-surface-200/80 bg-white p-1 shadow-soft-lg"
          >
            {options.map((size) => {
              const selected = size === value
              return (
                <button
                  key={size}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(size)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium tabular-nums transition-colors',
                    selected
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-surface-700 hover:bg-surface-50',
                  )}
                >
                  <span>{size}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
