import { mkdir, writeFile, unlink } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

const PRODUCT_DIR = path.join(process.cwd(), 'public', 'uploads', 'products')
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function saveProductImage(file: File, sellerId: string): Promise<string> {
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

  await mkdir(PRODUCT_DIR, { recursive: true })

  const filename = `${sellerId}-${randomBytes(8).toString('hex')}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(PRODUCT_DIR, filename), buffer)

  return `/uploads/products/${filename}`
}

export async function deleteProductImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl?.startsWith('/uploads/products/')) return
  const filePath = path.join(process.cwd(), 'public', imageUrl)
  try {
    await unlink(filePath)
  } catch {
    // ignore
  }
}
