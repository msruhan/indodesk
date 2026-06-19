import { fileTypeFromBuffer } from 'file-type'
import { MagicByteError } from '@/lib/uploads/validate'

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png'])
const PDF_MIME = 'application/pdf'

export type ValidatedCertificationUpload = {
  mime: string
  ext: string
  fileType: 'image' | 'pdf'
}

export async function validateCertificationUpload(
  buffer: Buffer,
  maxBytes: number,
): Promise<ValidatedCertificationUpload> {
  if (buffer.length === 0) {
    throw new MagicByteError('File kosong')
  }
  if (buffer.length > maxBytes) {
    throw new MagicByteError(`Ukuran file maksimal ${Math.round(maxBytes / (1024 * 1024))} MB`)
  }

  const detected = await fileTypeFromBuffer(buffer)
  if (!detected?.mime) {
    throw new MagicByteError('Format file tidak dikenali')
  }

  if (IMAGE_MIMES.has(detected.mime)) {
    return { mime: detected.mime, ext: detected.ext, fileType: 'image' }
  }

  if (detected.mime === PDF_MIME) {
    return { mime: PDF_MIME, ext: 'pdf', fileType: 'pdf' }
  }

  throw new MagicByteError('Format tidak diizinkan. Gunakan JPG, PNG, atau PDF.')
}
