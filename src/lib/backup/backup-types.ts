export type BackupArtifactKind = 'database' | 'uploads'

export type BackupManifestSummary = {
  id: string
  type: 'daily' | 'manual'
  tag: string | null
  createdAt: string
  databaseSizeBytes: number
  uploadsSizeBytes: number
  status: 'success' | 'failed'
}

export type BackupManifestDetail = BackupManifestSummary & {
  host?: string
  database: { key: string; sizeBytes: number; sha256: string }
  uploads: { key: string; sizeBytes: number; sha256: string }
}

export type BackupJobStatus = {
  status: 'idle' | 'running' | 'success' | 'failed'
  message: string | null
  updatedAt: string | null
}

export function formatBackupBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function parseBackupIndex(raw: unknown): BackupManifestSummary[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      if (typeof o.id !== 'string') return null
      return {
        id: o.id,
        type: o.type === 'daily' ? 'daily' : 'manual',
        tag: typeof o.tag === 'string' ? o.tag : null,
        createdAt: typeof o.createdAt === 'string' ? o.createdAt : '',
        databaseSizeBytes: Number(o.databaseSizeBytes) || 0,
        uploadsSizeBytes: Number(o.uploadsSizeBytes) || 0,
        status: o.status === 'failed' ? 'failed' : 'success',
      } satisfies BackupManifestSummary
    })
    .filter((x): x is BackupManifestSummary => x !== null)
}
