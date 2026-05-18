import { AdminIndodeskDownloadsView } from '@/components/admin/admin-indodesk-downloads-view'

export default function AdminIndodeskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Download IndoDesk
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Kelola link unduhan IndoDesk untuk Windows dan macOS. Perubahan langsung tampil di halaman Remote.
        </p>
      </div>
      <AdminIndodeskDownloadsView />
    </div>
  )
}
