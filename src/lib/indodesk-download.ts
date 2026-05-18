import type { IndodeskDownload, IndodeskPlatform } from '@prisma/client'

export type IndodeskDownloadDto = {
  id: string
  platform: 'windows' | 'macos'
  platformLabel: string
  downloadUrl: string
  version: string
  fileSize: string | null
  isActive: boolean
  updatedAt: string
}

const platformToSlug: Record<IndodeskPlatform, IndodeskDownloadDto['platform']> = {
  WINDOWS: 'windows',
  MACOS: 'macos',
}

const slugToPlatform: Record<IndodeskDownloadDto['platform'], IndodeskPlatform> = {
  windows: 'WINDOWS',
  macos: 'MACOS',
}

const platformLabels: Record<IndodeskPlatform, string> = {
  WINDOWS: 'Windows',
  MACOS: 'macOS',
}

export function platformSlugToEnum(slug: string): IndodeskPlatform | null {
  if (slug === 'windows' || slug === 'WINDOWS') return 'WINDOWS'
  if (slug === 'macos' || slug === 'MACOS') return 'MACOS'
  return slugToPlatform[slug as IndodeskDownloadDto['platform']] ?? null
}

export function serializeIndodeskDownload(row: IndodeskDownload): IndodeskDownloadDto {
  return {
    id: row.id,
    platform: platformToSlug[row.platform],
    platformLabel: platformLabels[row.platform],
    downloadUrl: row.downloadUrl,
    version: row.version,
    fileSize: row.fileSize,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const DEFAULT_INODESK_DOWNLOADS: Array<{
  platform: IndodeskPlatform
  downloadUrl: string
  version: string
  fileSize: string
}> = [
  {
    platform: 'WINDOWS',
    downloadUrl: 'https://github.com/rustdesk/rustdesk/releases/latest/download/rustdesk-x86_64.exe',
    version: '1.3.7',
    fileSize: '~15 MB',
  },
  {
    platform: 'MACOS',
    downloadUrl: 'https://github.com/rustdesk/rustdesk/releases/latest/download/rustdesk-x86_64.dmg',
    version: '1.3.7',
    fileSize: '~20 MB',
  },
]
