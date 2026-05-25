import { PRODUCT_PUBLISH_FLOW_STEPS } from '@/lib/product-listing-ui'

export function TeknisiProductPublishFaq() {
  return (
    <div className="border-b border-surface-200/70 pb-4">
      <h4 className="mb-1 font-semibold text-ink">Bagaimana alur publikasi iklan produk?</h4>
      <p className="mb-3 text-sm text-surface-500">
        Review admin vs tampil/sembunyikan di marketplace — dua langkah berbeda.
      </p>
      <ol className="grid gap-3 sm:grid-cols-1">
        {PRODUCT_PUBLISH_FLOW_STEPS.map((item) => (
          <li
            key={item.step}
            className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3.5"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-800">
              {item.step}
            </span>
            <p className="mt-2 text-[13px] font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-surface-600">{item.body}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
