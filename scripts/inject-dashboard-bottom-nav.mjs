#!/usr/bin/env node
/**
 * Inject DashboardBottomNav + DashboardMobileSpacer into every dashboard layout.
 * Idempotent — skips files that already contain DashboardBottomNav.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'src/app')

const IMPORT_LINE = `import { DashboardBottomNav, DashboardMobileSpacer } from '@/components/mobile/dashboard-bottom-nav'`

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...(await walk(p)))
    else if (e.name === 'layout.tsx') files.push(p)
  }
  return files
}

async function main() {
  const files = await walk(ROOT)
  const touched = []

  for (const file of files) {
    let text = await fs.readFile(file, 'utf8')

    // Only target dashboard layouts (admin, teknisi, user, dashboard)
    const isDashboard =
      file.includes('/admin/') ||
      file.includes('/teknisi/') ||
      file.includes('/user/') ||
      file.includes('/dashboard/')

    if (!isDashboard) continue
    // Skip the root layout
    if (file.endsWith('src/app/layout.tsx')) continue
    // Must contain a Sidebar reference to be a dashboard layout
    if (!text.includes('Sidebar')) continue
    // Already injected
    if (text.includes('DashboardBottomNav')) continue

    // 1. Add import after the last existing import line
    const importInsertPoint = text.lastIndexOf("import ")
    const importLineEnd = text.indexOf('\n', importInsertPoint)
    text = text.slice(0, importLineEnd + 1) + IMPORT_LINE + '\n' + text.slice(importLineEnd + 1)

    // 2. Add components before the closing </div> of the root wrapper
    // The pattern is: </main>\n      </div>\n    </div>
    // We insert DashboardMobileSpacer inside <main> and DashboardBottomNav after </main>'s parent </div>
    // Simpler: insert before the LAST </div> in the return
    const lastDivClose = text.lastIndexOf('    </div>\n  )')
    if (lastDivClose === -1) {
      // Try alternate indentation
      const alt = text.lastIndexOf('</div>\n  )')
      if (alt === -1) continue
      text = text.slice(0, alt) + '      <DashboardMobileSpacer />\n      <DashboardBottomNav />\n    ' + text.slice(alt)
    } else {
      text = text.slice(0, lastDivClose) + '      <DashboardMobileSpacer />\n      <DashboardBottomNav />\n    </div>\n  )' + text.slice(lastDivClose + '    </div>\n  )'.length)
    }

    await fs.writeFile(file, text, 'utf8')
    touched.push(path.relative(process.cwd(), file))
  }

  console.log(`✓ injected DashboardBottomNav into ${touched.length} layout files`)
  for (const f of touched) console.log('  ·', f)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
