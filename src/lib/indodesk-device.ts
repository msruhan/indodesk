import type { IndodeskClientRole, IndodeskDevice } from '@prisma/client'
import { normalizeIndodeskId } from '@/lib/indodesk-otp'

export type IndodeskDeviceDto = {
  id: string
  role: 'user' | 'teknisi'
  rustdeskId: string
  platform: string | null
  lastSeenAt: string | null
  createdAt: string
}

const roleToSlug: Record<IndodeskClientRole, IndodeskDeviceDto['role']> = {
  USER: 'user',
  TEKNISI: 'teknisi',
}

export function serializeIndodeskDevice(row: IndodeskDevice): IndodeskDeviceDto {
  return {
    id: row.id,
    role: roleToSlug[row.role],
    rustdeskId: row.rustdeskId,
    platform: row.platform,
    lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export function slugToIndodeskClientRole(slug: string): IndodeskClientRole | null {
  if (slug === 'user' || slug === 'USER') return 'USER'
  if (slug === 'teknisi' || slug === 'TEKNISI') return 'TEKNISI'
  return null
}

export function normalizeRustdeskIdForMatch(id: string): string {
  return normalizeIndodeskId(id)
}
