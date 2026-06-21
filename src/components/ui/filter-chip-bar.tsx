'use client'

import { cn } from '@/lib/utils'

export type FilterChipOption<T extends string> = {
  id: T
  label: string
}

type FilterChipBarProps<T extends string> = {
  options: readonly FilterChipOption<T>[]
  value: T
  onChange: (id: T) => void
  /** First option id treated as "all" — shows reset bar when another is selected */
  allValue?: T
  getCount?: (id: T) => number | undefined
  className?: string
}

/**
 * Horizontal filter chips with a visible active state and optional reset banner.
 */
export function FilterChipBar<T extends string>({
  options,
  value,
  onChange,
  allValue,
  getCount,
  className,
}: FilterChipBarProps<T>) {
  const defaultId = allValue ?? options[0]?.id
  const activeOption = options.find((o) => o.id === value)
  const showReset = defaultId !== undefined && value !== defaultId

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="-mx-4 flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-0.5 sm:mx-0 sm:px-0">
        {options.map((opt) => {
          const active = value === opt.id
          const count = getCount?.(opt.id)

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={active}
              className={cn(
                'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200',
                active
                  ? 'bg-primary-600 text-white shadow-soft-sm ring-1 ring-inset ring-primary-700/40'
                  : 'border border-surface-200 bg-white text-surface-700 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-800',
              )}
            >
              <span>{opt.label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    'min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[9px] font-bold tabular-nums',
                    active ? 'bg-white/25 text-white' : 'bg-surface-100 text-surface-600',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {showReset && activeOption && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary-200/70 bg-primary-50/80 px-3.5 py-2.5">
          <p className="text-xs text-surface-600">
            Menampilkan{' '}
            <span className="font-semibold text-primary-800">{activeOption.label}</span>
            {getCount && (
              <span className="text-surface-500"> · {getCount(value)} transaksi</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => onChange(defaultId as T)}
            className="shrink-0 text-xs font-semibold text-primary-700 underline-offset-2 hover:underline"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  )
}
