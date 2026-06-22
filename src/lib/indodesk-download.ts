import type { IndodeskClientRole, IndodeskDownload, IndodeskPlatform } from '@prisma/client'

export type IndodeskDownloadDto = {
  id: string
  platform: 'windows' | 'macos'
  role: 'user' | 'teknisi'
  platformLabel: string
  roleLabel: string
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

const roleToSlug: Record<IndodeskClientRole, IndodeskDownloadDto['role']> = {
  USER: 'user',
  TEKNISI: 'teknisi',
}

const slugToRole: Record<IndodeskDownloadDto['role'], IndodeskClientRole> = {
  user: 'USER',
  teknisi: 'TEKNISI',
}

const platformLabels: Record<IndodeskPlatform, string> = {
  WINDOWS: 'Windows',
  MACOS: 'macOS',
}

const roleLabels: Record<IndodeskClientRole, string> = {
  USER: 'Pelanggan',
  TEKNISI: 'Teknisi',
}

export function platformSlugToEnum(slug: string): IndodeskPlatform | null {
  if (slug === 'windows' || slug === 'WINDOWS') return 'WINDOWS'
  if (slug === 'macos' || slug === 'MACOS') return 'MACOS'
  return slugToPlatform[slug as IndodeskDownloadDto['platform']] ?? null
}

export function roleSlugToEnum(slug: string): IndodeskClientRole | null {
  if (slug === 'user' || slug === 'USER') return 'USER'
  if (slug === 'teknisi' || slug === 'TEKNISI') return 'TEKNISI'
  return slugToRole[slug as IndodeskDownloadDto['role']] ?? null
}

export function serializeIndodeskDownload(row: IndodeskDownload): IndodeskDownloadDto {
  return {
    id: row.id,
    platform: platformToSlug[row.platform],
    role: roleToSlug[row.role],
    platformLabel: platformLabels[row.platform],
    roleLabel: roleLabels[row.role],
    downloadUrl: row.downloadUrl,
    version: row.version,
    fileSize: row.fileSize,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const DEFAULT_INODESK_DOWNLOADS: Array<{
  platform: IndodeskPlatform
  role: IndodeskClientRole
  downloadUrl: string
  version: string
  fileSize: string
}> = [
  {
    platform: 'WINDOWS',
    role: 'USER',
    downloadUrl: 'https://github.com/msruhan/rustdesk/releases/latest/download/indodesk-user-windows.zip',
    version: '1.4.6',
    fileSize: '~15 MB',
  },
  {
    platform: 'MACOS',
    role: 'USER',
    downloadUrl: 'https://github.com/msruhan/rustdesk/releases/latest/download/indodesk-user-macos.dmg',
    version: '1.4.6',
    fileSize: '~20 MB',
  },
  {
    platform: 'WINDOWS',
    role: 'TEKNISI',
    downloadUrl: 'https://github.com/msruhan/rustdesk/releases/latest/download/indodesk-teknisi-windows.zip',
    version: '1.4.6',
    fileSize: '~15 MB',
  },
  {
    platform: 'MACOS',
    role: 'TEKNISI',
    downloadUrl: 'https://github.com/msruhan/rustdesk/releases/latest/download/indodesk-teknisi-macos.dmg',
    version: '1.4.6',
    fileSize: '~20 MB',
  },
]
