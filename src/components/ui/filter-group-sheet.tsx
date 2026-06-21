'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Filter, X } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FilterDropdownOption } from '@/components/ui/filter-dropdown'

export type FilterGroupConfig<T extends string = string> = {
  id: string
  label: string
  value: T
  onChange: (value: T) => void
  options: FilterDropdownOption<T>[]
}

type FilterGroupSheetProps = {
  groups: FilterGroupConfig[]
  onReset?: () => void
  disabled?: boolean
  className?: string
  title?: string
}

const VIEWPORT_SIDE_MARGIN = 16
/** Sama lebar dropdown filter standar (15.5rem). */
const DESKTOP_PANEL_WIDTH = 248

function FilterGroupPillOptions({ groups }: { groups: FilterGroupConfig[] }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400">
            {group.label}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {group.options.map((option) => {
              const selected = option.id === group.value
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => group.onChange(option.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                    selected
                      ? 'bg-primary-600 text-white shadow-soft-sm'
                      : 'border border-surface-200 bg-white text-surface-700 hover:border-primary-200 hover:bg-primary-50/50',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function FilterGroupListOptions({ groups }: { groups: FilterGroupConfig[] }) {
  return (
    <div className="max-h-64 overflow-y-auto">
      {groups.map((group, groupIndex) => (
        <div key={group.id}>
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-surface-400">
            {group.label}
          </p>
          {group.options.map((option) => {
            const selected = option.id === group.value
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => group.onChange(option.id)}
                className={cn(
                  'relative flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] font-medium transition-all',
                  selected
                    ? 'bg-primary-50 text-primary-900 shadow-[inset_3px_0_0_0] shadow-primary-500'
                    : 'text-surface-700 hover:bg-surface-50',
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    selected ? 'bg-primary-600' : 'bg-surface-300',
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
              </button>
            )
          })}
          {groupIndex < groups.length - 1 && (
            <div className="mx-2.5 my-1 border-b border-surface-100" aria-hidden />
          )}
        </div>
      ))}
    </div>
  )
}

export function FilterGroupSheet({
  groups,
  onReset,
  disabled = false,
  className,
  title = 'Filter',
}: FilterGroupSheetProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const width = Math.min(vw - VIEWPORT_SIDE_MARGIN * 2, DESKTOP_PANEL_WIDTH)
    let left = rect.right - width
    left = Math.max(VIEWPORT_SIDE_MARGIN, Math.min(left, vw - width - VIEWPORT_SIDE_MARGIN))

    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width,
      zIndex: 200,
    })
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!open || isDesktop) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, isDesktop])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open || !isDesktop) return
    updatePanelPosition()
    const raf = requestAnimationFrame(() => updatePanelPosition())
    const onLayout = () => updatePanelPosition()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
    }
  }, [open, isDesktop, updatePanelPosition])

  useEffect(() => {
    if (!open || !isDesktop) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, isDesktop])

  const activeCount = useMemo(
    () =>
      groups.filter((group) => {
        const defaultId = group.options[0]?.id
        return defaultId !== undefined && group.value !== defaultId
      }).length,
    [groups],
  )

  const isFiltered = activeCount > 0

  const mobileSheet =
    mounted && !isDesktop ? (
      createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.button
                type="button"
                aria-label="Tutup filter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-2xl border border-surface-200/80 bg-white shadow-soft-lg md:hidden"
                role="dialog"
                aria-modal
                aria-label={title}
              >
                <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-ink">{title}</h2>
                  <div className="flex items-center gap-2">
                    {onReset && activeCount > 0 && (
                      <button
                        type="button"
                        onClick={onReset}
                        className="text-[11px] font-medium text-primary-700 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-surface-200 text-surface-600 hover:bg-surface-50"
                      aria-label="Tutup"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[calc(85dvh-7.5rem)] overflow-y-auto px-4 py-4">
                  <FilterGroupPillOptions groups={groups} />
                </div>

                <div
                  className="border-t border-surface-100 px-4 py-3"
                  style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
                >
                  <Button type="button" variant="primary" className="h-10 w-full" onClick={() => setOpen(false)}>
                    Selesai
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )
    ) : null

  const desktopPopover =
    mounted && isDesktop ? (
      createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              style={panelStyle}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)]"
              role="dialog"
              aria-label={title}
            >
              {onReset && activeCount > 0 && (
                <div className="flex justify-end px-2.5 pb-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={onReset}
                    className="text-[10px] font-medium text-primary-700 hover:underline"
                  >
                    Reset
                  </button>
                </div>
              )}
              <FilterGroupListOptions groups={groups} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )
    ) : null

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-label={title}
        aria-expanded={open}
        className={cn(
          'group relative inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 transition-all sm:h-10 sm:min-w-[10.5rem] sm:px-2.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2',
          open
            ? 'border-primary-300/80 bg-white shadow-soft-md ring-2 ring-primary-100/80'
            : isFiltered
              ? 'border-primary-200/80 bg-gradient-to-r from-primary-50/90 to-white text-primary-800 shadow-soft-sm hover:shadow-soft-md'
              : 'border-surface-200/70 bg-white text-surface-700 shadow-soft-xs hover:border-primary-200/60 hover:bg-primary-50/30',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors',
            open || isFiltered
              ? 'bg-primary-50 text-primary-700 ring-primary-200/70'
              : 'bg-surface-50 text-primary-600 ring-surface-200/70 group-hover:bg-primary-50',
          )}
        >
          <Filter className="h-3.5 w-3.5" />
        </span>
        <span className="hidden min-w-0 flex-1 text-left sm:block">
          <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-surface-400">
            {title}
          </span>
          <span className="block truncate text-[12.5px] font-semibold leading-tight text-surface-800">
            {isFiltered ? `${activeCount} aktif` : 'Semua'}
          </span>
        </span>
        {isFiltered && !open && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[9px] font-bold text-white sm:hidden">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            'hidden h-4 w-4 shrink-0 text-surface-400 transition-transform group-hover:text-primary-600 sm:block',
            open && 'rotate-180 text-primary-600',
          )}
        />
      </button>

      {desktopPopover}
      {mobileSheet}
    </div>
  )
}
