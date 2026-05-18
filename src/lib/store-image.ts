import { mkdir, writeFile, unlink } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

const STORE_DIR = path.join(process.cwd(), 'public', 'uploads', 'stores')
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function saveStoreCover(file: File, userId: string): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Format gambar harus JPEG, PNG, WebP, atau GIF')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Ukuran gambar maksimal 5 MB')
  }

  const ext =
    file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'webp'
          : 'gif'

  await mkdir(STORE_DIR, { recursive: true })

  const filename = `${userId}-${randomBytes(8).toString('hex')}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(STORE_DIR, filename), buffer)

  return `/uploads/stores/${filename}`
}

export async function deleteStoreCover(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl?.startsWith('/uploads/stores/')) return
  const filePath = path.join(process.cwd(), 'public', imageUrl)
  try {
    await unlink(filePath)
  } catch {
    // ignore missing file
  }
}
