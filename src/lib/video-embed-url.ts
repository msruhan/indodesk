export type VideoEmbedPlatform = 'youtube' | 'vimeo' | 'tiktok'

export type ParsedVideoEmbed = {
  platform: VideoEmbedPlatform
  originalUrl: string
  embedUrl: string
  thumbnailUrl?: string
}

function tryParseUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url
  } catch {
    return null
  }
}

function parseYouTube(url: URL): ParsedVideoEmbed | null {
  const host = url.hostname.replace(/^www\./, '')
  let videoId: string | null = null

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null
  } else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v')
    } else if (url.pathname.startsWith('/embed/')) {
      videoId = url.pathname.split('/')[2] ?? null
    } else if (url.pathname.startsWith('/shorts/')) {
      videoId = url.pathname.split('/')[2] ?? null
    }
  }

  if (!videoId || !/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) return null

  return {
    platform: 'youtube',
    originalUrl: url.toString(),
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  }
}

function parseVimeo(url: URL): ParsedVideoEmbed | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null

  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts.find((p) => /^\d+$/.test(p))
  if (!id) return null

  return {
    platform: 'vimeo',
    originalUrl: url.toString(),
    embedUrl: `https://player.vimeo.com/video/${id}`,
  }
}

function parseTikTok(url: URL): ParsedVideoEmbed | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'tiktok.com' && host !== 'vm.tiktok.com') return null

  const match = url.pathname.match(/\/video\/(\d+)/)
  if (!match?.[1]) return null

  return {
    platform: 'tiktok',
    originalUrl: url.toString(),
    embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
  }
}

/** Validate and normalize a third-party video URL for embed display. */
export function parseVideoEmbedUrl(raw: string | null | undefined): ParsedVideoEmbed | null {
  if (!raw?.trim()) return null
  const url = tryParseUrl(raw)
  if (!url) return null

  return parseYouTube(url) ?? parseVimeo(url) ?? parseTikTok(url)
}

export function isAllowedVideoUrl(raw: string): boolean {
  return parseVideoEmbedUrl(raw) !== null
}
