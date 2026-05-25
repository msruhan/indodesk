'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Filter } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type CategoryFilterOption = {
  value: string
  label: string
  count?: number
}

type CategoryFilterDropdownProps = {
  value: string
  onChange: (value: string) => void
  options: CategoryFilterOption[]
  className?: string
  disabled?: boolean
}

export function CategoryFilterDropdown({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: CategoryFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  )

  const isFiltered = value !== 'all' && value !== options[0]?.value

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

  const handleSelect = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'inline-flex h-9 min-w-[10.5rem] max-w-full items-center gap-2 rounded-xl border px-3 text-left text-xs font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2',
          open || isFiltered
            ? 'border-primary-300/80 bg-primary-600 text-white shadow-soft-sm'
            : 'border-surface-200/80 bg-white text-surface-700 shadow-soft-xs hover:border-primary-200/80 hover:bg-primary-50/40',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <Filter
          className={cn('h-3.5 w-3.5 shrink-0', open || isFiltered ? 'text-white/90' : 'text-primary-600')}
        />
        <span className="min-w-0 flex-1 truncate">{activeOption?.label ?? 'Kategori'}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
            open || isFiltered ? 'text-white/80' : 'text-surface-400',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,16rem)] overflow-hidden rounded-xl border border-surface-200/80 bg-white/95 p-1 shadow-soft-lg backdrop-blur-xl"
          >
            <div className="max-h-56 overflow-y-auto">
              {options.map((option) => {
                const selected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                      selected
                        ? 'bg-primary-50 text-primary-800'
                        : 'text-surface-700 hover:bg-surface-50',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                          selected ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600',
                        )}
                      >
                        {option.count}
                      </span>
                    )}
                    {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-700" />}
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
