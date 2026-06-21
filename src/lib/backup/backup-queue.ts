import { promises as fs } from 'fs'
import path from 'path'
import type { BackupJobStatus } from '@/lib/backup/backup-types'

const QUEUE_DIR = process.env.BACKUP_QUEUE_DIR?.trim() || '/app/backups-queue'

export function backupQueueDir(): string {
  return QUEUE_DIR
}

export async function readBackupJobStatus(): Promise<BackupJobStatus> {
  try {
    const raw = await fs.readFile(path.join(QUEUE_DIR, '.last-job.json'), 'utf8')
    const json = JSON.parse(raw) as { status?: string; message?: string; updatedAt?: string }
    const status = json.status
    if (status === 'running' || status === 'success' || status === 'failed') {
      return {
        status,
        message: json.message ?? null,
        updatedAt: json.updatedAt ?? null,
      }
    }
  } catch {
    /* idle */
  }
  return { status: 'idle', message: null, updatedAt: null }
}

export async function queueManualBackup(): Promise<void> {
  await fs.mkdir(QUEUE_DIR, { recursive: true })
  await fs.writeFile(
    path.join(QUEUE_DIR, '.pending'),
    `${new Date().toISOString()}\n`,
    'utf8',
  )
}

export async function isManualBackupPending(): Promise<boolean> {
  try {
    await fs.access(path.join(QUEUE_DIR, '.pending'))
    return true
  } catch {
    return false
  }
}
