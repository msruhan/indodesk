/**
 * Generate display-sized WebP variants for brand logos (public/icon/).
 *
 *   node scripts/optimize-brand-webp.mjs
 */
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICON_DIR = join(__dirname, '../public/icon')

const VARIANTS = [
  { input: 'iconbantootext.png', output: 'iconbantootext.webp', maxWidth: 960 },
  { input: 'iconbantoo.png', output: 'iconbantoo.webp', maxWidth: 512 },
]

for (const { input, output, maxWidth } of VARIANTS) {
  const inputPath = join(ICON_DIR, input)
  const outputPath = join(ICON_DIR, output)

  if (!existsSync(inputPath)) {
    throw new Error(`Missing ${inputPath}`)
  }

  const info = await sharp(inputPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(outputPath)

  console.log(`${input} → ${output}: ${info.width}x${info.height}, ${info.size} bytes`)
}
