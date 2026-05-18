export const NAV_RETURN_STORAGE_KEY = 'indoteknizi:nav-return'

/** Simpan path saat ini sebelum navigasi ke halaman lain (mis. keranjang). */
export function saveNavReturnPath(path: string | null | undefined) {
  if (typeof window === 'undefined' || !path || path === '/cart') return
  sessionStorage.setItem(NAV_RETURN_STORAGE_KEY, path)
}

export function getNavReturnPath(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(NAV_RETURN_STORAGE_KEY)
}

export function clearNavReturnPath() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(NAV_RETURN_STORAGE_KEY)
}
