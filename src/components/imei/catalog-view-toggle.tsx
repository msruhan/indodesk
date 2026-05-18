'use client'

import { cn } from '@/lib/utils'
import { LayoutDashboard, Menu } from '@/lib/icons'

export type CatalogViewMode = 'grid' | 'list'

const STORAGE_KEY = 'imei-catalog-view-mode'

export function loadCatalogViewMode(): CatalogViewMode {
  if (typeof window === 'undefined') return 'grid'
  return localStorage.getItem(STORAGE_KEY) === 'list' ? 'list' : 'grid'
}

export function saveCatalogViewMode(mode: CatalogViewMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore quota / private mode */
  }
}

type CatalogViewToggleProps = {
  mode: CatalogViewMode
  onChange: (mode: CatalogViewMode) => void
  variant?: 'primary' | 'amber'
  disabled?: boolean
}

export function CatalogViewToggle({
  mode,
  onChange,
  variant = 'primary',
  disabled,
}: CatalogViewToggleProps) {
  const activeClass =
    variant === 'amber'
      ? 'bg-amber-600 text-white shadow-soft-sm'
      : 'bg-primary-600 text-white shadow-soft-sm'

  return (
    <div
      role="group"
      aria-label="Mode tampilan katalog"
      className="inline-flex rounded-lg border border-surface-200/70 bg-white/80 p-0.5 backdrop-blur-md"
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === 'grid'}
        aria-label="Tampilan grid"
        onClick={() => onChange('grid')}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          mode === 'grid' ? activeClass : 'text-surface-600 hover:bg-surface-50 hover:text-ink',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === 'list'}
        aria-label="Tampilan list"
        onClick={() => onChange('list')}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          mode === 'list' ? activeClass : 'text-surface-600 hover:bg-surface-50 hover:text-ink',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <Menu className="h-4 w-4" />
      </button>
    </div>
  )
}
