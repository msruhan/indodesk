/**
 * Remove solid white background via edge flood-fill, then trim transparent padding.
 * Preserves interior white (e.g. infinity symbol on green icon).
 *
 * Reads from *.source.png (auto-backup on first run), writes transparent PNG
 * to the paths used by the app (iconbantoo.png, iconbantootext.png).
 */
import sharp from 'sharp'
import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICON_DIR = join(__dirname, '../public/icon')

const OUTPUTS = ['iconbantoo.png', 'iconbantootext.png']

const WHITE_THRESHOLD = 248
const FUZZ = 12

function isBackground(r, g, b) {
  return r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD
}

function floodTransparent(pixels, width, height) {
  const visited = new Uint8Array(width * height)
  const queue = []

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const i = y * width + x
    if (visited[i]) return
    const p = i * 4
    if (!isBackground(pixels[p], pixels[p + 1], pixels[p + 2])) return
    visited[i] = 1
    queue.push(i)
  }

  for (let x = 0; x < width; x++) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    push(0, y)
    push(width - 1, y)
  }

  while (queue.length > 0) {
    const i = queue.pop()
    const x = i % width
    const y = (i - x) / width
    const p = i * 4
    pixels[p + 3] = 0

    push(x - 1, y)
    push(x + 1, y)
    push(x, y - 1)
    push(x, y + 1)
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const p = i * 4
      if (pixels[p + 3] === 0) continue
      const r = pixels[p]
      const g = pixels[p + 1]
      const b = pixels[p + 2]
      if (r > 255 - FUZZ && g > 255 - FUZZ && b > 255 - FUZZ) {
        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ]
        const touchesTransparent = neighbors.some(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) return true
          return pixels[(ny * width + nx) * 4 + 3] === 0
        })
        if (touchesTransparent) pixels[p + 3] = 0
      }
    }
  }
}

async function processLogo(outputName) {
  const outputPath = join(ICON_DIR, outputName)
  const sourcePath = join(ICON_DIR, outputName.replace('.png', '.source.png'))

  if (!existsSync(outputPath)) {
    throw new Error(`Missing ${outputName} in public/icon`)
  }

  if (!existsSync(sourcePath)) {
    copyFileSync(outputPath, sourcePath)
    console.log(`Backup: ${outputName} → ${basename(sourcePath)}`)
  }

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8Array(data)
  floodTransparent(pixels, info.width, info.height)

  const trimmed = await sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()

  writeFileSync(outputPath, trimmed)
  const meta = await sharp(outputPath).metadata()
  console.log(
    `${basename(sourcePath)} → ${outputName}: ${meta.width}x${meta.height}, alpha=${meta.hasAlpha}`,
  )
}

for (const name of OUTPUTS) {
  await processLogo(name)
}
