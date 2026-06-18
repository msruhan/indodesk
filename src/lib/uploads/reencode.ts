import sharp from 'sharp'

export type ReencodedImage = {
  buffer: Buffer
  mime: string
  ext: string
}

/**
 * Re-encode images to strip EXIF/metadata and normalize format (R4.2).
 * GIF is passed through unchanged (animated).
 */
export async function reencodeImage(buffer: Buffer, mime: string): Promise<ReencodedImage> {
  if (mime === 'image/gif') {
    return { buffer, mime, ext: 'gif' }
  }

  // Re-encode without preserving metadata (EXIF stripped on output).
  const img = sharp(buffer).rotate()

  if (mime === 'image/png') {
    return {
      buffer: await img.png({ compressionLevel: 9 }).toBuffer(),
      mime: 'image/png',
      ext: 'png',
    }
  }

  if (mime === 'image/webp') {
    return {
      buffer: await img.webp({ quality: 85 }).toBuffer(),
      mime: 'image/webp',
      ext: 'webp',
    }
  }

  return {
    buffer: await img.jpeg({ quality: 85, mozjpeg: true }).toBuffer(),
    mime: 'image/jpeg',
    ext: 'jpg',
  }
}
