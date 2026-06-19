import { AdminPricingView } from '@/components/admin/admin-pricing-view'

export default function AdminPricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Pricing Landing
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Kelola section pricing di homepage — header, paket, fitur, harga, dan tombol CTA.
        </p>
      </div>
      <AdminPricingView />
    </div>
  )
}
