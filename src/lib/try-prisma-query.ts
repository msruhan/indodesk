/** Jalankan query Prisma; kembalikan fallback jika gagal (mis. migrasi belum di-deploy). */
export async function tryPrismaQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    console.error(`[tryPrismaQuery:${label}]`, detail, e)
    return fallback
  }
}
