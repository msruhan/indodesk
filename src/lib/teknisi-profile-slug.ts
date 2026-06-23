/** Slug URL-friendly dari nama lengkap teknisi (huruf kecil, spasi → strip). */
export function slugifyTeknisiName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return base || 'teknisi'
}

export function teknisiProfilePath(profileSlug: string | null | undefined, userId: string): string {
  return `/teknisi/${profileSlug?.trim() || userId}`
}
