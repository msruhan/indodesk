import { AdminHelpManageView } from '@/components/admin/admin-help-manage-view'

export default function AdminHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Pusat Bantuan
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Kelola kontak support dan pertanyaan umum yang ditampilkan di pusat bantuan untuk setiap peran.
        </p>
      </div>
      <AdminHelpManageView />
    </div>
  )
}
