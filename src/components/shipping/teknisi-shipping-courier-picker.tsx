'use client'

import { CHECKOUT_COURIER_CODES } from '@/lib/shipping-config'
import { courierLabelFromEnum, fromBinderbyteCourier } from '@/lib/shipping-courier'
import { cn } from '@/lib/utils'

type Props = {
  value: string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
}

export function TeknisiShippingCourierPicker({ value, onChange, disabled = false }: Props) {
  const selected = new Set(value.map((c) => c.toLowerCase()))

  const toggle = (code: string) => {
    if (disabled) return
    const normalized = code.toLowerCase()
    if (selected.has(normalized)) {
      onChange(value.filter((c) => c.toLowerCase() !== normalized))
      return
    }
    onChange([...value, normalized])
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-surface-500">
        Pilih kurir yang tersedia di daerah Anda. Pembeli hanya bisa memilih dari daftar ini saat
        checkout.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {CHECKOUT_COURIER_CODES.map((code) => {
          const enumVal = fromBinderbyteCourier(code)
          const label = enumVal ? courierLabelFromEnum(enumVal) : code.toUpperCase()
          const checked = selected.has(code)
          return (
            <label
              key={code}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                checked
                  ? 'border-primary-300 bg-primary-50/80 text-ink'
                  : 'border-surface-200 bg-white text-surface-700 hover:border-primary-200',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary-600"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(code)}
              />
              <span className="font-medium">{label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
