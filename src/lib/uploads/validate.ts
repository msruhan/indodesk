import { fileTypeFromBuffer } from 'file-type'

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export class MagicByteError extends Error {
  readonly code = 'MAGIC_BYTE_INVALID'

  constructor(message: string) {
    super(message)
    this.name = 'MagicByteError'
  }
}

export type ValidatedUpload = {
  mime: string
  ext: string
}

export async function validateUpload(
  buffer: Buffer,
  maxBytes: number,
): Promise<ValidatedUpload> {
  if (buffer.length === 0) {
    throw new MagicByteError('File kosong')
  }
  if (buffer.length > maxBytes) {
    throw new MagicByteError(`Ukuran file maksimal ${Math.round(maxBytes / (1024 * 1024))} MB`)
  }

  const detected = await fileTypeFromBuffer(buffer)
  if (!detected?.mime || !IMAGE_MIMES.has(detected.mime)) {
    throw new MagicByteError('Format file tidak dikenali atau tidak diizinkan (JPEG, PNG, WebP, GIF)')
  }

  return { mime: detected.mime, ext: detected.ext }
}
