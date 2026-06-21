import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { fetchBackupIndex, isBackupStorageConfigured } from '@/lib/backup/r2-backup-client'
import { readBackupJobStatus, isManualBackupPending } from '@/lib/backup/backup-queue'
import { formatBackupBytes } from '@/lib/backup/backup-types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const configured = isBackupStorageConfigured()
    const items = configured ? await fetchBackupIndex() : []
    const job = await readBackupJobStatus()
    const pending = await isManualBackupPending()

    const lastBackup = items[0] ?? null
    const stats = {
      dailyCount: items.filter((i) => i.type === 'daily').length,
      manualCount: items.filter((i) => i.type === 'manual').length,
      totalDatabaseBytes: items.reduce((s, i) => s + i.databaseSizeBytes, 0),
      totalUploadsBytes: items.reduce((s, i) => s + i.uploadsSizeBytes, 0),
    }

    return apiSuccess({
      configured,
      items: items.map((item) => ({
        ...item,
        databaseSizeLabel: formatBackupBytes(item.databaseSizeBytes),
        uploadsSizeLabel: formatBackupBytes(item.uploadsSizeBytes),
        totalSizeLabel: formatBackupBytes(item.databaseSizeBytes + item.uploadsSizeBytes),
      })),
      lastBackup,
      stats,
      job: pending && job.status === 'idle' ? { ...job, status: 'running' as const, message: 'Menunggu cron VPS…' } : job,
    })
  } catch (e) {
    console.error('[ADMIN_BACKUP_GET]', e)
    return apiError('Gagal memuat daftar backup', 500)
  }
}
