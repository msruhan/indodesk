import 'server-only'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  parseBackupIndex,
  type BackupArtifactKind,
  type BackupManifestSummary,
} from '@/lib/backup/backup-types'

const PRESIGN_TTL_SECONDS = 15 * 60
const INDEX_CACHE_MS = 60_000

type BackupR2Config = {
  bucket: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
}

let client: S3Client | null = null
let indexCache: { at: number; items: BackupManifestSummary[] } | null = null

function getBackupR2Config(): BackupR2Config | null {
  const bucket = process.env.BACKUP_R2_BUCKET?.trim()
  const endpoint = process.env.BACKUP_R2_ENDPOINT?.trim()
  const accessKeyId = process.env.BACKUP_R2_READ_ACCESS_KEY_ID?.trim() || process.env.BACKUP_R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.BACKUP_R2_READ_SECRET_ACCESS_KEY?.trim() || process.env.BACKUP_R2_SECRET_ACCESS_KEY?.trim()

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return null

  return { bucket, endpoint, accessKeyId, secretAccessKey }
}

function getClient(cfg: BackupR2Config): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })
  }
  return client
}

export function isBackupStorageConfigured(): boolean {
  return getBackupR2Config() !== null
}

export async function fetchBackupIndex(): Promise<BackupManifestSummary[]> {
  const now = Date.now()
  if (indexCache && now - indexCache.at < INDEX_CACHE_MS) {
    return indexCache.items
  }

  const cfg = getBackupR2Config()
  if (!cfg) return []

  try {
    const res = await getClient(cfg).send(
      new GetObjectCommand({
        Bucket: cfg.bucket,
        Key: 'backups/index.json',
      }),
    )
    if (!res.Body) return []
    const text = await res.Body.transformToString()
    const items = parseBackupIndex(JSON.parse(text))
    indexCache = { at: now, items }
    return items
  } catch {
    return []
  }
}

async function resolveArtifactKey(backupId: string, artifact: BackupArtifactKind): Promise<string | null> {
  for (const kind of ['daily', 'manual'] as const) {
    const manifestKey = `backups/${kind}/${backupId}/manifest.json`
    try {
      const cfg = getBackupR2Config()
      if (!cfg) return null
      const res = await getClient(cfg).send(
        new GetObjectCommand({ Bucket: cfg.bucket, Key: manifestKey }),
      )
      if (!res.Body) continue
      const manifest = JSON.parse(await res.Body.transformToString()) as {
        database?: { key?: string }
        uploads?: { key?: string }
      }
      const key = artifact === 'database' ? manifest.database?.key : manifest.uploads?.key
      if (key) return key
    } catch {
      /* try next prefix */
    }
  }
  return null
}

export async function getPresignedBackupDownloadUrl(
  backupId: string,
  artifact: BackupArtifactKind,
): Promise<{ url: string; expiresAt: string } | null> {
  const cfg = getBackupR2Config()
  if (!cfg) return null

  const key = await resolveArtifactKey(backupId, artifact)
  if (!key) return null

  const url = await getSignedUrl(
    getClient(cfg),
    new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
    { expiresIn: PRESIGN_TTL_SECONDS },
  )

  return {
    url,
    expiresAt: new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000).toISOString(),
  }
}

export function invalidateBackupIndexCache(): void {
  indexCache = null
}
