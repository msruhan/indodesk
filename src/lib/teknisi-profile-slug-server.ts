import 'server-only'

import { prisma } from '@/lib/db'
import { slugifyTeknisiName } from '@/lib/teknisi-profile-slug'

type SlugClient = Pick<typeof prisma, 'teknisiProfile'>

function randomSlugSuffix(length = 4): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .padEnd(length, '0')
}

/** Alokasi slug unik; jika nama sama persis, tambah suffix acak. */
export async function allocateTeknisiProfileSlug(
  name: string,
  excludeUserId?: string,
  client: SlugClient = prisma,
): Promise<string> {
  const base = slugifyTeknisiName(name)
  let candidate = base

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const existing = await client.teknisiProfile.findFirst({
      where: {
        profileSlug: candidate,
        ...(excludeUserId ? { NOT: { userId: excludeUserId } } : {}),
      },
      select: { userId: true },
    })
    if (!existing) return candidate
    candidate = `${base}-${randomSlugSuffix()}`
  }

  return `${base}-${Date.now().toString(36).slice(-4)}`
}

/** Resolve slug atau legacy userId → userId teknisi. */
export async function resolveTeknisiUserId(slugOrId: string): Promise<string | null> {
  const trimmed = slugOrId.trim()
  if (!trimmed) return null

  const bySlug = await prisma.teknisiProfile.findUnique({
    where: { profileSlug: trimmed },
    select: { userId: true },
  })
  if (bySlug) return bySlug.userId

  const byUserId = await prisma.teknisiProfile.findUnique({
    where: { userId: trimmed },
    select: { userId: true },
  })
  return byUserId?.userId ?? null
}

/** Backfill slug yang belum ada (idempotent). */
export async function ensureTeknisiProfileSlugForUser(userId: string): Promise<string | null> {
  const row = await prisma.teknisiProfile.findUnique({
    where: { userId },
    select: { profileSlug: true, user: { select: { name: true } } },
  })
  if (!row) return null
  if (row.profileSlug) return row.profileSlug

  const profileSlug = await allocateTeknisiProfileSlug(row.user.name, userId)
  await prisma.teknisiProfile.update({
    where: { userId },
    data: { profileSlug },
  })
  return profileSlug
}
