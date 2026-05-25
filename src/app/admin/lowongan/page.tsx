import { AdminLowonganView } from '@/components/admin/admin-lowongan-view'

export default function AdminLowonganPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Manajemen Lowongan Kerja
        </h1>
        <p className="mt-1 text-sm text-surface-500">Kelola lowongan kerja teknisi di platform</p>
      </div>
      <AdminLowonganView />
    </div>
  )
}
