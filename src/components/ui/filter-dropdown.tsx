'use client'

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Filter } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type FilterDropdownTone = 'neutral' | 'warning' | 'info' | 'success' | 'danger' | 'primary'

export type FilterDropdownOption<T extends string = string> = {
  id: T
  label: string
  count?: number
  icon?: ComponentType<{ className?: string }>
  tone?: FilterDropdownTone
}

const toneDotClass: Record<FilterDropdownTone, string> = {
  neutral: 'bg-surface-400',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  success: 'bg-primary-500',
  danger: 'bg-red-500',
  primary: 'bg-primary-600',
}

const toneIconWrapClass: Record<FilterDropdownTone, string> = {
  neutral: 'bg-surface-100 text-surface-600 ring-surface-200/80',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  info: 'bg-blue-50 text-blue-700 ring-blue-200/70',
  success: 'bg-primary-50 text-primary-700 ring-primary-200/70',
  danger: 'bg-red-50 text-red-700 ring-red-200/70',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200/70',
}

type FilterDropdownProps<T extends string> = {
  options: FilterDropdownOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
  disabled?: boolean
  placeholder?: string
  align?: 'left' | 'right'
  /** Short label above selected value on trigger, e.g. "Status" */
  label?: string
  triggerIcon?: ComponentType<{ className?: string }>
}

export function FilterDropdown<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = 'Filter',
  disabled = false,
  placeholder = 'Pilih filter',
  align = 'left',
  label,
  triggerIcon: TriggerIconProp,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeOption = useMemo(
    () => options.find((opt) => opt.id === value) ?? options[0],
    [options, value],
  )

  const defaultId = options[0]?.id
  const isFiltered = defaultId !== undefined && value !== defaultId
  const activeTone = activeOption?.tone ?? (isFiltered ? 'primary' : 'neutral')
  const TriggerIcon = TriggerIconProp ?? activeOption?.icon ?? Filter

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

  const handleSelect = (next: T) => {
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
        aria-label={ariaLabel}
        className={cn(
          'group inline-flex h-10 w-full min-w-[11rem] items-center gap-2.5 rounded-xl border px-2.5 text-left transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2',
          open
            ? 'border-primary-300/80 bg-white shadow-soft-md ring-2 ring-primary-100/80'
            : isFiltered
              ? 'border-primary-200/80 bg-gradient-to-r from-primary-50/90 to-white shadow-soft-sm hover:shadow-soft-md'
              : 'border-surface-200/70 bg-white/95 shadow-soft-xs hover:border-primary-200/60 hover:bg-primary-50/30 hover:shadow-soft-sm',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors',
            open || isFiltered ? toneIconWrapClass[activeTone] : 'bg-surface-50 text-primary-600 ring-surface-200/70 group-hover:bg-primary-50',
          )}
        >
          <TriggerIcon className="h-3.5 w-3.5" />
        </span>

        <span className="min-w-0 flex-1">
          {label && (
            <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-surface-400">
              {label}
            </span>
          )}
          <span
            className={cn(
              'block truncate text-[12.5px] font-semibold leading-tight',
              isFiltered ? 'text-primary-800' : 'text-surface-800',
            )}
          >
            {activeOption?.label ?? placeholder}
          </span>
        </span>

        {isFiltered && !open && (
          <span className={cn('h-2 w-2 shrink-0 rounded-full', toneDotClass[activeTone])} />
        )}

        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200 group-hover:text-primary-600',
            open && 'rotate-180 text-primary-600',
          )}
        />
      </button>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div
            role="listbox"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,15.5rem)] overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {label && (
              <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-surface-400">
                {label}
              </p>
            )}
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => {
                const selected = option.id === value
                const OptionIcon = option.icon
                const dotTone = option.tone ?? 'neutral'
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      'relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[12.5px] font-medium transition-all',
                      selected
                        ? 'bg-primary-50 text-primary-900 shadow-[inset_3px_0_0_0] shadow-primary-500'
                        : 'text-surface-700 hover:bg-surface-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                        selected ? toneIconWrapClass[dotTone] : 'bg-surface-50 text-surface-500 ring-surface-200/60',
                      )}
                    >
                      {OptionIcon ? (
                        <OptionIcon className="h-3.5 w-3.5" />
                      ) : (
                        <span className={cn('h-2 w-2 rounded-full', toneDotClass[dotTone])} />
                      )}
                    </span>
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
                    {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
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
