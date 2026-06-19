'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { RekberSellerOption } from '@/lib/rekber-seller-types'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronDown, Search, Store, Users } from '@/lib/icons'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (sellerId: string) => void
  sellers: RekberSellerOption[]
  search: string
  onSearchChange: (query: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
}

function SellerRow({
  seller,
  selected,
  onSelect,
}: {
  seller: RekberSellerOption
  selected: boolean
  onSelect: () => void
}) {
  const isTeknisi = seller.sellerType === 'teknisi'

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
        selected
          ? 'bg-primary-50 shadow-[inset_3px_0_0_0] shadow-primary-500'
          : 'hover:bg-surface-50',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1 ring-inset',
          isTeknisi
            ? 'bg-amber-50 text-amber-800 ring-amber-200/70'
            : 'bg-surface-100 text-surface-700 ring-surface-200/70',
        )}
      >
        {seller.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{seller.name}</span>
        <span className="block truncate text-[11px] text-surface-500">
          {isTeknisi ? (seller.subtitle ?? 'Teknisi') : seller.email}
        </span>
      </span>
      <Badge
        className={cn(
          'shrink-0 text-[10px] font-semibold',
          isTeknisi ? 'bg-amber-50 text-amber-800' : 'bg-surface-100 text-surface-700',
        )}
      >
        {seller.sellerTypeLabel}
      </Badge>
      {selected && <Check className="h-4 w-4 shrink-0 text-primary-600" />}
    </button>
  )
}

function SellerSection({
  title,
  icon: Icon,
  count,
  tone,
  children,
}: {
  title: string
  icon: typeof Store
  count: number
  tone: 'amber' | 'neutral'
  children: ReactNode
}) {
  if (count === 0) return null

  return (
    <div className="py-1">
      <div
        className={cn(
          'sticky top-0 z-10 flex items-center gap-2 px-3 py-2 backdrop-blur-sm',
          tone === 'amber' ? 'bg-amber-50/95' : 'bg-surface-50/95',
        )}
      >
        <Icon
          className={cn('h-3.5 w-3.5', tone === 'amber' ? 'text-amber-700' : 'text-surface-600')}
        />
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-[0.14em]',
            tone === 'amber' ? 'text-amber-800' : 'text-surface-600',
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
            tone === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-surface-200 text-surface-700',
          )}
        >
          {count}
        </span>
      </div>
      <div className="space-y-0.5 px-1">{children}</div>
    </div>
  )
}

export function RekberSellerPicker({
  value,
  onChange,
  sellers,
  search,
  onSearchChange,
  loading = false,
  disabled = false,
  placeholder = 'Pilih penjual…',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => sellers.find((s) => s.id === value) ?? null,
    [sellers, value],
  )

  const teknisi = useMemo(
    () => sellers.filter((s) => s.sellerType === 'teknisi'),
    [sellers],
  )
  const members = useMemo(
    () => sellers.filter((s) => s.sellerType === 'member'),
    [sellers],
  )

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

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchRef.current?.focus(), 80)
    }
  }, [open])

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  const triggerLabel = selected
    ? `${selected.name} — ${selected.sellerTypeLabel}`
    : loading
      ? 'Memuat daftar penjual…'
      : placeholder

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'group flex h-11 w-full items-center gap-3 rounded-xl border px-3 text-left transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2',
          open
            ? 'border-primary-300 bg-white shadow-soft-md ring-2 ring-primary-100/80'
            : selected
              ? 'border-primary-200/80 bg-gradient-to-r from-primary-50/60 to-white shadow-soft-sm hover:shadow-soft-md'
              : 'border-surface-200/80 bg-white shadow-soft-xs hover:border-primary-200/60 hover:bg-primary-50/20',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
            selected
              ? selected.sellerType === 'teknisi'
                ? 'bg-amber-50 text-amber-800 ring-amber-200/70'
                : 'bg-surface-100 text-surface-700 ring-surface-200/70'
              : 'bg-surface-50 text-primary-600 ring-surface-200/70 group-hover:bg-primary-50',
          )}
        >
          {selected ? (
            <span className="text-xs font-bold">{selected.name.charAt(0).toUpperCase()}</span>
          ) : (
            <Store className="h-4 w-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400">
            Penjual
          </span>
          <span
            className={cn(
              'block truncate text-sm font-semibold',
              selected ? 'text-ink' : 'text-surface-500',
            )}
          >
            {triggerLabel}
          </span>
        </span>
        {selected && (
          <Badge
            className={cn(
              'hidden shrink-0 sm:inline-flex',
              selected.sellerType === 'teknisi'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-surface-100 text-surface-700',
            )}
          >
            {selected.sellerTypeLabel}
          </Badge>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200 group-hover:text-primary-600',
            open && 'rotate-180 text-primary-600',
          )}
        />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            role="listbox"
            aria-label="Pilih penjual"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-[0_20px_48px_-16px_rgba(15,23,42,0.22)]"
          >
            <div className="border-b border-surface-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Cari nama atau email…"
                  className="h-10 w-full rounded-xl border border-surface-200/80 bg-surface-50/80 pl-9 pr-3 text-sm text-ink placeholder:text-surface-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-surface-500">
                  Memuat daftar penjual…
                </div>
              ) : sellers.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-surface-500">
                  {search.trim()
                    ? 'Tidak ada penjual yang cocok dengan pencarian.'
                    : 'Belum ada penjual terdaftar.'}
                </div>
              ) : (
                <>
                  <SellerSection
                    title="Teknisi"
                    icon={Store}
                    count={teknisi.length}
                    tone="amber"
                  >
                    {teknisi.map((seller) => (
                      <SellerRow
                        key={seller.id}
                        seller={seller}
                        selected={seller.id === value}
                        onSelect={() => handleSelect(seller.id)}
                      />
                    ))}
                  </SellerSection>

                  {teknisi.length > 0 && members.length > 0 && (
                    <div className="mx-3 my-1 border-t border-surface-100" />
                  )}

                  <SellerSection title="Member" icon={Users} count={members.length} tone="neutral">
                    {members.map((seller) => (
                      <SellerRow
                        key={seller.id}
                        seller={seller}
                        selected={seller.id === value}
                        onSelect={() => handleSelect(seller.id)}
                      />
                    ))}
                  </SellerSection>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {value && (
        <input type="hidden" name="sellerId" value={value} required />
      )}
    </div>
  )
}
