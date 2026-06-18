import type { Product, ProductCouponDiscountType } from '@prisma/client'

export type ProductCouponInput = {
  enabled: boolean
  code: string
  discountType: ProductCouponDiscountType
  discountValue: string
}

export type ProductCouponConfig = {
  code: string
  discountType: ProductCouponDiscountType
  discountValue: number
}

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

export function validateProductCouponInput(
  input: ProductCouponInput,
  productPrice?: number,
): string | null {
  if (!input.enabled) return null

  const code = normalizeCouponCode(input.code)
  if (code.length < 3) return 'Kode kupon minimal 3 karakter'
  if (code.length > 20) return 'Kode kupon maksimal 20 karakter'
  if (!input.discountType) return 'Pilih jenis diskon kupon'

  const value = Number(input.discountValue)
  if (!Number.isFinite(value) || value <= 0) return 'Nilai diskon kupon tidak valid'

  if (input.discountType === 'PERCENT') {
    if (value < 1 || value > 90) return 'Diskon persen kupon antara 1–90%'
    return null
  }

  if (value < 1000) return 'Diskon nominal kupon minimal Rp 1.000'
  if (productPrice != null && value >= productPrice) {
    return 'Diskon nominal harus lebih kecil dari harga produk'
  }
  return null
}

export function couponInputToDb(
  input: ProductCouponInput,
  productPrice?: number,
): {
  couponCode: string | null
  couponDiscountType: ProductCouponDiscountType | null
  couponDiscountValue: number | null
} {
  if (!input.enabled) {
    return { couponCode: null, couponDiscountType: null, couponDiscountValue: null }
  }

  const err = validateProductCouponInput(input, productPrice)
  if (err) throw new Error(err)

  return {
    couponCode: normalizeCouponCode(input.code),
    couponDiscountType: input.discountType,
    couponDiscountValue: Number(input.discountValue),
  }
}

export function parseCouponFromForm(form: FormData): ProductCouponInput {
  const enabled = form.get('couponEnabled') === 'true'
  const discountType = form.get('couponDiscountType')
  return {
    enabled,
    code: String(form.get('couponCode') ?? ''),
    discountType:
      discountType === 'PERCENT' || discountType === 'FIXED' ? discountType : 'PERCENT',
    discountValue: String(form.get('couponDiscountValue') ?? ''),
  }
}

export function couponFromProduct(
  p: Pick<Product, 'couponCode' | 'couponDiscountType' | 'couponDiscountValue'>,
): ProductCouponConfig | null {
  if (!p.couponCode || !p.couponDiscountType || p.couponDiscountValue == null) return null
  return {
    code: p.couponCode,
    discountType: p.couponDiscountType,
    discountValue: Number(p.couponDiscountValue),
  }
}

export function formatCouponLabel(coupon: ProductCouponConfig): string {
  if (coupon.discountType === 'PERCENT') return `Diskon ${coupon.discountValue}%`
  return `Potongan ${formatIdr(coupon.discountValue)}`
}

export function calcLineCouponDiscount(
  lineSubtotal: number,
  coupon: ProductCouponConfig | null,
  enteredCode: string | null | undefined,
): number {
  if (!coupon || !enteredCode?.trim()) return 0
  if (normalizeCouponCode(enteredCode) !== coupon.code) return 0

  if (coupon.discountType === 'PERCENT') {
    return Math.min(lineSubtotal, Math.round((lineSubtotal * coupon.discountValue) / 100))
  }
  return Math.min(coupon.discountValue, lineSubtotal)
}

export function calcCartCouponDiscount(
  items: Array<{ price: number; quantity: number; coupon?: ProductCouponConfig | null }>,
  enteredCode: string | null | undefined,
): number {
  return items.reduce((sum, item) => {
    const lineSubtotal = item.price * item.quantity
    return sum + calcLineCouponDiscount(lineSubtotal, item.coupon ?? null, enteredCode)
  }, 0)
}
