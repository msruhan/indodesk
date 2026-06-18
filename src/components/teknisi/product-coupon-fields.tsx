'use client'

import type { ProductCouponDiscountType } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { formatCouponLabel, type ProductCouponConfig } from '@/lib/product-coupon'
import { cn } from '@/lib/utils'
import { Sparkles } from '@/lib/icons'

export type ProductCouponFormState = {
  enabled: boolean
  code: string
  discountType: ProductCouponDiscountType
  discountValue: string
}

export const emptyProductCouponForm: ProductCouponFormState = {
  enabled: false,
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
}

export function productCouponFormFromDto(
  coupon: ProductCouponConfig | null,
): ProductCouponFormState {
  if (!coupon) return emptyProductCouponForm
  return {
    enabled: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
  }
}

type ProductCouponFieldsProps = {
  value: ProductCouponFormState
  onChange: (next: ProductCouponFormState) => void
  productPrice?: number
}

export function ProductCouponFields({ value, onChange, productPrice }: ProductCouponFieldsProps) {
  const preview =
    value.enabled && value.code.trim() && Number(value.discountValue) > 0
      ? formatCouponLabel({
          code: value.code.trim().toUpperCase(),
          discountType: value.discountType,
          discountValue: Number(value.discountValue),
        })
      : null

  return (
    <div className="md:col-span-2 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Kupon diskon</p>
          <p className="mt-0.5 text-[11px] text-surface-500">
            Opsional. Pembeli bisa memasukkan kode saat checkout untuk mendapat diskon pada produk ini.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-surface-700">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-200"
          />
          Aktifkan kupon
        </label>
      </div>

      {value.enabled && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-surface-600">Kode kupon</label>
            <Input
              value={value.code}
              onChange={(e) =>
                onChange({ ...value, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })
              }
              placeholder="HEMAT10"
              maxLength={20}
              className="font-mono uppercase tracking-wide"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600">Jenis diskon</label>
            <select
              value={value.discountType}
              onChange={(e) =>
                onChange({
                  ...value,
                  discountType: e.target.value as ProductCouponDiscountType,
                })
              }
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
            >
              <option value="PERCENT">Persen (%)</option>
              <option value="FIXED">Nominal (Rp)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600">
              {value.discountType === 'PERCENT' ? 'Diskon (%)' : 'Potongan (Rp)'}
            </label>
            <Input
              type="number"
              min={value.discountType === 'PERCENT' ? 1 : 1000}
              max={value.discountType === 'PERCENT' ? 90 : undefined}
              value={value.discountValue}
              onChange={(e) => onChange({ ...value, discountValue: e.target.value })}
              placeholder={value.discountType === 'PERCENT' ? '10' : '5000'}
            />
          </div>
        </div>
      )}

      {preview && (
        <p
          className={cn(
            'mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary-200/70 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-800',
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {value.code.toUpperCase()} · {preview}
          {productPrice != null && value.discountType === 'FIXED' && (
            <span className="text-primary-700/70">· harga Rp {productPrice.toLocaleString('id-ID')}</span>
          )}
        </p>
      )}
    </div>
  )
}

export function appendCouponToFormData(fd: FormData, coupon: ProductCouponFormState) {
  fd.append('couponEnabled', String(coupon.enabled))
  fd.append('couponCode', coupon.code)
  fd.append('couponDiscountType', coupon.discountType)
  fd.append('couponDiscountValue', coupon.discountValue)
}
