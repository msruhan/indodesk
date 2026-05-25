'use client'

import { Input } from '@/components/ui/input'
import {
  STORE_WEEKDAYS,
  type StoreOperatingHours,
  type StoreWeekdayKey,
} from '@/lib/store-operating-hours'

export function OperatingHoursEditor({
  title = 'Jam operasional',
  hint = 'Atur jam buka per hari.',
  hours,
  onChange,
  className,
}: {
  title?: string
  hint?: string
  hours: StoreOperatingHours
  onChange: (hours: StoreOperatingHours) => void
  className?: string
}) {
  const updateDay = (key: StoreWeekdayKey, patch: Partial<StoreOperatingHours[StoreWeekdayKey]>) => {
    onChange({
      ...hours,
      [key]: { ...hours[key], ...patch },
    })
  }

  return (
    <div className={className ?? 'space-y-3'}>
      <div>
        <p className="text-sm font-medium text-surface-700">{title}</p>
        {hint && <p className="mt-0.5 text-[11px] text-surface-500">{hint}</p>}
      </div>
      <div className="space-y-2">
        {STORE_WEEKDAYS.map(({ key, label }) => {
          const day = hours[key]
          return (
            <div
              key={key}
              className="flex flex-col gap-2 rounded-xl border border-surface-200/80 bg-surface-50/40 p-3 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="w-20 shrink-0 text-sm font-semibold text-ink">{label}</span>
              <label className="flex shrink-0 items-center gap-2 text-xs text-surface-600">
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) => updateDay(key, { closed: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500/30"
                />
                Tutup
              </label>
              {!day.closed && (
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-surface-500">Dari</span>
                  <Input
                    type="time"
                    value={day.open}
                    onChange={(e) => updateDay(key, { open: e.target.value })}
                    className="h-9 w-[7.5rem] shrink-0"
                  />
                  <span className="text-[11px] font-medium text-surface-500">Sampai</span>
                  <Input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateDay(key, { close: e.target.value })}
                    className="h-9 w-[7.5rem] shrink-0"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
