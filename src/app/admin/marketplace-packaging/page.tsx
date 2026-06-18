import { AdminMarketplacePackagingPanel } from '@/components/admin/admin-marketplace-packaging-panel'

export const metadata = {
  title: 'Bukti Packaging · Admin IndoTeknizi',
  description: 'Review bukti packaging penjual sebelum pesanan diproses.',
}

export default function AdminMarketplacePackagingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <AdminMarketplacePackagingPanel />
    </div>
  )
}
