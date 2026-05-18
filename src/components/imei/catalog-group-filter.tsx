'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Filter } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type CatalogGroupFilterOption = {
  id: string
  label: string
  count: number
}

type CatalogGroupFilterProps = {
  value: string
  onChange: (id: string) => void
  options: CatalogGroupFilterOption[]
  variant?: 'primary' | 'amber'
  loading?: boolean
  className?: string
}

export function CatalogGroupFilter({
  value,
  onChange,
  options,
  variant = 'primary',
  loading = false,
  className,
}: CatalogGroupFilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeOption = useMemo(
    () => options.find((option) => option.id === value) ?? options[0],
    [options, value],
  )

  const activeStyles =
    variant === 'amber'
      ? 'border-amber-200/80 bg-amber-600 text-white shadow-soft-sm'
      : 'border-primary-200/80 bg-primary-600 text-white shadow-soft-sm'

  const activeItemStyles =
    variant === 'amber' ? 'bg-amber-50 text-amber-800' : 'bg-primary-50 text-primary-800'

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        disabled={loading || options.length === 0}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'inline-flex w-full max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-colors sm:w-auto sm:min-w-[12rem] sm:max-w-md',
          open || value !== 'all'
            ? activeStyles
            : 'border-surface-200/70 bg-white/80 text-surface-700 backdrop-blur-md hover:bg-white',
        )}
      >
        <Filter className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          {loading || !activeOption ? 'Memuat grup…' : `${activeOption.label} (${activeOption.count})`}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && !loading && options.length > 0 && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-surface-200/80 bg-white/95 shadow-soft-lg backdrop-blur-xl"
          >
            <div className="max-h-64 overflow-y-auto p-1">
              {options.map((option) => {
                const selected = option.id === value
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                      selected ? activeItemStyles : 'text-surface-700 hover:bg-surface-50',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <span className="shrink-0 tabular-nums text-[10px] text-surface-500">({option.count})</span>
                    {selected && <Check className={cn('h-3.5 w-3.5 shrink-0', variant === 'amber' ? 'text-amber-700' : 'text-primary-700')} />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
