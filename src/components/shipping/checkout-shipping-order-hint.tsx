const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

type Props = {
  courierLabel: string | null
  service: string | null
  shippingCost: number
}

export function CheckoutShippingOrderHint({ courierLabel, service, shippingCost }: Props) {
  if (!courierLabel && !service && shippingCost <= 0) return null

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-[10px] leading-relaxed text-amber-900">
      <p className="font-semibold">Kurir pilihan pembeli</p>
      <p className="mt-0.5">
        {courierLabel ?? '—'}
        {service ? ` · ${service}` : ''}
        {shippingCost > 0 ? ` · estimasi ${formatPrice(shippingCost)}` : ''}
      </p>
      <p className="mt-1 text-amber-800/90">
        Kirim pakai kurir &amp; layanan yang sama. Tagihan konter kurir bisa sedikit berbeda dari
        estimasi.
      </p>
    </div>
  )
}
