import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminEvent } from '@/lib/activity-log'
import { isBackupStorageConfigured } from '@/lib/backup/r2-backup-client'
import { queueManualBackup, readBackupJobStatus, isManualBackupPending } from '@/lib/backup/backup-queue'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'
import { withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  ...adminStepUpFields,
})

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  if (!isBackupStorageConfigured()) {
    return apiError('Backup R2 belum dikonfigurasi di server', 503)
  }

  const rl = await withRateLimit(req, ['admin', 'backup-trigger', session.user.id], {
    limit: 2,
    windowSeconds: 3600,
  })
  if (!rl.allowed) return rateLimitResponse(rl)

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

    const job = await readBackupJobStatus()
    if (job.status === 'running' || (await isManualBackupPending())) {
      return apiError('Backup manual masih berjalan atau menunggu antrian', 409)
    }

    await queueManualBackup()

    void logAdminEvent({
      action: 'admin.backup.triggered',
      severity: 'INFO',
      summary: `Admin meminta backup manual database`,
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
      },
    })

    return apiSuccess({
      queued: true,
      message: 'Backup manual dijadwalkan. Cron VPS akan memproses dalam beberapa menit.',
    })
  } catch (e) {
    console.error('[ADMIN_BACKUP_TRIGGER]', e)
    return apiError('Gagal menjadwalkan backup', 500)
  }
}
