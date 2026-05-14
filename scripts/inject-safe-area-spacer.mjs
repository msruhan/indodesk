#!/usr/bin/env node
/**
 * Inject <MobileSafeAreaSpacer /> directly before <BottomNav /> in every page
 * that mounts the floating dock, so its last content row is never tucked
 * under the dock on mobile.
 *
 * Idempotent — skips files that already contain MobileSafeAreaSpacer.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'src/app')

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...(await walk(p)))
    else if (e.name.endsWith('.tsx')) files.push(p)
  }
  return files
}

async function main() {
  const files = await walk(ROOT)
  const touched = []

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8')
    if (!text.includes('<BottomNav')) continue
    if (text.includes('MobileSafeAreaSpacer />')) continue // already injected (or in progress)

    const replaced = text.replace(
      /(\n)([ \t]*)<BottomNav\s*\/>/g,
      (_, nl, indent) => `${nl}${indent}<MobileSafeAreaSpacer />\n${indent}<BottomNav />`,
    )

    if (replaced !== text) {
      await fs.writeFile(file, replaced, 'utf8')
      touched.push(path.relative(process.cwd(), file))
    }
  }

  console.log(`✓ injected MobileSafeAreaSpacer into ${touched.length} files`)
  for (const f of touched) console.log('  ·', f)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
