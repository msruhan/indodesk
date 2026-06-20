'use client'

import type { ShippingCourier } from '@prisma/client'
import {
  CHECKOUT_SHIPPING_COURIER_OPTIONS,
  courierLabelFromEnum,
  SHIPPING_COURIER_OPTIONS,
} from '@/lib/shipping-courier'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-ink shadow-soft-xs focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-600'

type Props = {
  value: ShippingCourier
  lockedCourier: ShippingCourier | null
  onChange?: (courier: ShippingCourier) => void
  className?: string
}

export function SellerShipmentCourierField({
  value,
  lockedCourier,
  onChange,
  className,
}: Props) {
  const options = lockedCourier
    ? [{ value: lockedCourier, label: courierLabelFromEnum(lockedCourier) }]
    : CHECKOUT_SHIPPING_COURIER_OPTIONS.length > 0
      ? CHECKOUT_SHIPPING_COURIER_OPTIONS
      : SHIPPING_COURIER_OPTIONS

  return (
    <select
      className={className ?? selectClass}
      value={value}
      disabled={Boolean(lockedCourier)}
      onChange={(e) => onChange?.(e.target.value as ShippingCourier)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
