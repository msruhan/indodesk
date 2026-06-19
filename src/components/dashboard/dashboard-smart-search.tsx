'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/contexts/auth-context'
import { Search } from '@/lib/icons'
import {
  filterSmartSearchItems,
  mergeSearchResults,
  quickActionsForRole,
  type SmartSearchApiResult,
  type SmartSearchItem,
} from '@/lib/dashboard-smart-search'
import { mobileHeaderSearchInputClass } from '@/components/mobile/header-action-styles'
import { useFeatureFlags } from '@/contexts/feature-flags-context'

type MergedItem = SmartSearchItem | SmartSearchApiResult

function kindLabel(kind: MergedItem['kind']): string | null {
  switch (kind) {
    case 'quick':
      return null
    case 'order':
      return 'Order'
    case 'user':
      return 'User'
    case 'product':
      return 'Produk'
    case 'page':
      return 'Halaman'
    default:
      return null
  }
}

interface DashboardSmartSearchProps {
  role: UserRole
  className?: string
}

export function DashboardSmartSearch({ role, className }: DashboardSmartSearchProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [apiResults, setApiResults] = useState<SmartSearchApiResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const { flags } = useFeatureFlags()
  const quickActions = useMemo(() => quickActionsForRole(role, flags), [role, flags])

  const filteredQuick = useMemo(
    () => filterSmartSearchItems(quickActions, searchQuery),
    [quickActions, searchQuery],
  )

  const displayItems = useMemo(
    () => mergeSearchResults(filteredQuick, apiResults, 12),
    [filteredQuick, apiResults],
  )

  const fetchResults = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setApiResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: q.trim(), limit: '8' })
        const res = await fetch(`/api/search?${params}`, { cache: 'no-store' })
        const json = await res.json()
        if (res.ok && json.success) {
          setApiResults(json.data?.results ?? [])
        } else {
          setApiResults([])
        }
      } catch {
        setApiResults([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    const t = window.setTimeout(() => void fetchResults(searchQuery), 280)
    return () => window.clearTimeout(t)
  }, [searchQuery, fetchResults])

  useEffect(() => {
    setActiveIndex(0)
  }, [displayItems.length, searchQuery])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen(true)
        window.setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navigate = useCallback(
    (href: string) => {
      setIsOpen(false)
      setSearchQuery('')
      setApiResults([])
      router.push(href)
    },
    [router],
  )

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || displayItems.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % displayItems.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i - 1 + displayItems.length) % displayItems.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = displayItems[activeIndex]
      if (item) navigate(item.href)
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative w-full', className)}
      onKeyDown={handleListKeyDown}
    >
      <Search className={cn(searchInputIconClass, 'left-3.5')} strokeWidth={2} aria-hidden />
      <Input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="dashboard-smart-search-listbox"
        aria-autocomplete="list"
        placeholder={
          role === 'ADMIN'
            ? 'Cari order, user, produk…'
            : role === 'TEKNISI'
              ? 'Cari order, produk, transaksi…'
              : 'Cari order, layanan, transaksi…'
        }
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        className={mobileHeaderSearchInputClass}
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-surface-200/80 bg-white px-1.5 py-0.5 text-[10px] font-medium text-surface-500 sm:inline-flex">
        ⌘K
      </kbd>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,420px)] overflow-hidden rounded-2xl border border-surface-200/70 bg-white shadow-soft-lg"
          >
            <div className="flex items-center justify-between border-b border-surface-100 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-400">
                Smart search
              </span>
              {loading && (
                <span className="text-[11px] text-surface-400">Mencari…</span>
              )}
            </div>

            <div
              id="dashboard-smart-search-listbox"
              role="listbox"
              className="max-h-[min(60vh,360px)] overflow-y-auto p-2"
            >
              {displayItems.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-surface-500">
                  {searchQuery.trim().length >= 2
                    ? 'Tidak ada hasil. Coba kode order atau nama lain.'
                    : 'Ketik minimal 2 karakter untuk mencari data, atau pilih pintasan di bawah.'}
                </p>
              ) : (
                <div className="space-y-1">
                  {displayItems.map((item, index) => {
                    const badge = kindLabel(item.kind)
                    const isActive = index === activeIndex
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        role="option"
                        aria-selected={isActive}
                        className={cn(
                          'flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors',
                          isActive ? 'bg-primary-50 ring-1 ring-primary-200/60' : 'hover:bg-surface-50',
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          setIsOpen(false)
                          setSearchQuery('')
                          setApiResults([])
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-ink">{item.label}</span>
                            {badge ? (
                              <span className="shrink-0 rounded-md bg-surface-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface-500">
                                {badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-surface-500">{item.hint}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-surface-100 px-3 py-2 text-[10px] text-surface-400">
              <span className="hidden sm:inline">↑↓ navigasi · Enter buka · Esc tutup</span>
              <span className="sm:hidden">Ketuk hasil untuk membuka</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
