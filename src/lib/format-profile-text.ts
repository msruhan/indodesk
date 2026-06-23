/**
 * Memecah teks profil bebas menjadi paragraf yang lebih mudah dibaca di halaman publik.
 */
export function splitProfileTextParagraphs(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .trim()
    .replace(/[ \t]+/g, ' ')

  if (!normalized) return []

  const byBlank = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (byBlank.length > 1) return byBlank

  const byLine = normalized
    .split(/\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (byLine.length > 1) return byLine

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length > 1) {
    const paragraphs: string[] = []
    let current = ''

    for (const sentence of sentences) {
      const next = current ? `${current} ${sentence}` : sentence
      if (next.length > 320 && current) {
        paragraphs.push(current.trim())
        current = sentence
      } else {
        current = next
      }
    }

    if (current.trim()) paragraphs.push(current.trim())
    return paragraphs
  }

  if (normalized.length > 280) {
    return splitLongBlock(normalized, 280)
  }

  return [normalized]
}

function splitLongBlock(text: string, maxLen: number): string[] {
  const paragraphs: string[] = []
  let rest = text

  while (rest.length > maxLen) {
    const slice = rest.slice(0, maxLen)
    const breakAt = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf(','))
    const idx = breakAt > maxLen * 0.45 ? breakAt : maxLen
    paragraphs.push(rest.slice(0, idx).trim())
    rest = rest.slice(idx).trim()
  }

  if (rest) paragraphs.push(rest)
  return paragraphs
}
