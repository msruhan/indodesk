/** Client-safe helpers for image URLs (no Node fs / AWS SDK). */

export function getR2PublicBaseUrl(): string | null {
  const base =
    process.env.R2_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ??
    null
  return base?.replace(/\/$/, '') ?? null
}

export function isR2PublicUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const base = getR2PublicBaseUrl()
  if (base && (url === base || url.startsWith(`${base}/`))) return true
  // Fallback when env tidak tersedia di browser bundle
  return /^https:\/\/pub-[a-f0-9]+\.r2\.dev\//i.test(url)
}

export function isPlatformHostedImageUrl(
  imageUrl: string | null | undefined,
  localUrlPrefix: string,
): boolean {
  if (!imageUrl) return false
  return isR2PublicUrl(imageUrl) || imageUrl.startsWith(localUrlPrefix)
}

/** Map R2 public URL → same-origin proxy (hindari DNS/SSL ISP yang memblokir *.r2.dev). */
export function r2UrlToMediaProxyPath(url: string): string | null {
  if (!isR2PublicUrl(url)) return null
  const base = getR2PublicBaseUrl()
  if (base && url.startsWith(`${base}/`)) {
    return `/api/media/${url.slice(base.length + 1)}`
  }
  const match = url.match(/^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/i)
  return match ? `/api/media/${match[1]}` : null
}

export function isPrivateMediaApiUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith('/api/media/private/'))
}

export function resolveDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (isPrivateMediaApiUrl(url)) return url
  return r2UrlToMediaProxyPath(url) ?? url
}
