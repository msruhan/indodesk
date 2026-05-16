import { AdminNotificationsView } from '@/components/admin/admin-notifications-view'

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Notifikasi Platform
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Kelola isi popup lonceng di header untuk user, teknisi, dan admin.
        </p>
      </div>
      <AdminNotificationsView />
    </div>
  )
}
