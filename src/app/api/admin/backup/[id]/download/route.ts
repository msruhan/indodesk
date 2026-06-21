import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminEvent } from '@/lib/activity-log'
import type { BackupArtifactKind } from '@/lib/backup/backup-types'
import { getPresignedBackupDownloadUrl, isBackupStorageConfigured } from '@/lib/backup/r2-backup-client'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  artifact: z.enum(['database', 'uploads']),
  ...adminStepUpFields,
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id: backupId } = await params

  if (!isBackupStorageConfigured()) {
    return apiError('Backup R2 belum dikonfigurasi', 503)
  }

  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    try {
      await verifyAdminStepUp(session.user.id, {
        confirmPassword: parsed.data.confirmPassword,
        totp: parsed.data.totp,
      })
    } catch (e) {
      if (e instanceof StepUpAuthError) return apiError(e.message, 401)
      throw e
    }

    const artifact = parsed.data.artifact as BackupArtifactKind
    const signed = await getPresignedBackupDownloadUrl(backupId, artifact)
    if (!signed) return apiError('Backup tidak ditemukan', 404)

    void logAdminEvent({
      action: `admin.backup.download.${artifact}`,
      severity: 'INFO',
      summary: `Admin mengunduh backup ${backupId} (${artifact})`,
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
      },
      metadata: { backupId, artifact },
    })

    return apiSuccess(signed)
  } catch (e) {
    console.error('[ADMIN_BACKUP_DOWNLOAD]', e)
    return apiError('Gagal membuat tautan unduh', 500)
  }
}
