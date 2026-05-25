/**
 * Smoke test: upload a tiny PNG to Cloudflare R2 using .env credentials.
 * Run: npx tsx scripts/test-r2-upload.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })

async function main() {
  const { isR2Configured, uploadFileToR2 } = await import('../src/lib/r2-storage')

  if (!isR2Configured()) {
    console.error('FAIL: R2 env tidak lengkap (cek R2_* di .env)')
    process.exit(1)
  }

  // 1x1 red PNG
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const buffer = Buffer.from(pngBase64, 'base64')
  const file = new File([buffer], 'test-upload.png', { type: 'image/png' })

  console.log('Uploading test image to R2...')
  const url = await uploadFileToR2('test-uploads', file, 'smoke-test', 5 * 1024 * 1024)
  console.log('OK — public URL:', url)

  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) {
      console.warn(
        'WARN: URL tidak dapat diakses (HTTP',
        res.status,
        '). Pastikan Public access (r2.dev) aktif di bucket.',
      )
      process.exit(2)
    }
    console.log('OK — gambar dapat diakses publik (HTTP', res.status + ')')
  } catch {
    console.log('Upload R2 berhasil. Verifikasi manual di browser:', url)
  }
}

main().catch((e) => {
  console.error('FAIL:', e instanceof Error ? e.message : e)
  process.exit(1)
})
