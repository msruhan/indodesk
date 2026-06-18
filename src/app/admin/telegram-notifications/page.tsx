import { AdminTelegramNotificationsView } from '@/components/admin/admin-telegram-notifications-view'

export default function AdminTelegramNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Notifikasi Telegram
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Atur channel broadcast dan template pesan otomatis untuk teknisi serta channel produk baru.
        </p>
      </div>
      <AdminTelegramNotificationsView />
    </div>
  )
}
