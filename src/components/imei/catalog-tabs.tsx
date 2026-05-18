'use client'

import { cn } from '@/lib/utils'

export type CatalogTab = 'imei' | 'server'

type CatalogTabsProps = {
  value: CatalogTab
  onChange: (tab: CatalogTab) => void
  imeiCount?: number
  serverCount?: number
  className?: string
}

export function CatalogTabs({ value, onChange, imeiCount, serverCount, className }: CatalogTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Jenis layanan"
      className={cn('inline-flex items-center gap-0.5 rounded-lg border border-surface-200/70 bg-white/80 p-0.5', className)}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'imei'}
        onClick={() => onChange('imei')}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3',
          value === 'imei'
            ? 'bg-primary-600 text-white'
            : 'text-surface-600 hover:bg-surface-50 hover:text-ink',
        )}
      >
        Layanan Perangkat
        {imeiCount !== undefined && (
          <span
            className={cn(
              'rounded-full px-1 py-px text-[9px] tabular-nums',
              value === 'imei' ? 'bg-white/20' : 'bg-surface-100 text-surface-500',
            )}
          >
            {imeiCount}
          </span>
        )}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'server'}
        onClick={() => onChange('server')}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3',
          value === 'server'
            ? 'bg-amber-600 text-white'
            : 'text-surface-600 hover:bg-surface-50 hover:text-ink',
        )}
      >
        Server Services
        {serverCount !== undefined && (
          <span
            className={cn(
              'rounded-full px-1 py-px text-[9px] tabular-nums',
              value === 'server' ? 'bg-white/20' : 'bg-surface-100 text-surface-500',
            )}
          >
            {serverCount}
          </span>
        )}
      </button>
    </div>
  )
}
