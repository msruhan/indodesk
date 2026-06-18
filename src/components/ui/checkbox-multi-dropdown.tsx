'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type CheckboxMultiOption = {
  value: string
  label: string
}

type CheckboxMultiDropdownProps = {
  value: string[]
  onChange: (value: string[]) => void
  options: readonly CheckboxMultiOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

export function CheckboxMultiDropdown({
  value,
  onChange,
  options,
  placeholder = 'Pilih…',
  className,
  disabled = false,
  id,
}: CheckboxMultiDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const labelByValue = useMemo(
    () => new Map(options.map((o) => [o.value, o.label])),
    [options],
  )

  const summary = useMemo(() => {
    if (value.length === 0) return placeholder
    if (value.length <= 2) {
      return value.map((v) => labelByValue.get(v) ?? v).join(', ')
    }
    return `${value.length} part dipilih`
  }, [value, placeholder, labelByValue])

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

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-sm shadow-soft-xs transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200/50 focus-visible:ring-offset-2',
          open
            ? 'border-primary-300'
            : 'border-surface-200 hover:border-surface-300',
          value.length > 0 ? 'text-ink' : 'text-surface-400',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-surface-500 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-multiselectable="true"
            className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-surface-200/80 bg-white p-1.5 shadow-soft-md"
          >
            {options.map((option) => {
              const checked = value.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    checked
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-surface-700 hover:bg-surface-50',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
                      checked
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-surface-300 bg-white',
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="font-medium">{option.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
