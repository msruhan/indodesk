import { AdminBannersView } from '@/components/admin/admin-banners-view'

export default function AdminBannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Banner Marketplace
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Kelola slide promosi yang tampil di halaman marketplace.
        </p>
      </div>
      <AdminBannersView />
    </div>
  )
}
