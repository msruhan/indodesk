import { AdminBackupView } from '@/components/admin/admin-backup-view'

export default function AdminBackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Backup Database
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Cadangan PostgreSQL dan uploads. Restore hanya via operator VPS (SSH).
        </p>
      </div>
      <AdminBackupView />
    </div>
  )
}
