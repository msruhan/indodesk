#!/usr/bin/env node
/**
 * Single-pass text-contrast repair.
 *
 * Replaces stamped patterns where `text-white` was used on white cards
 * and where dim `text-surface-400` was used as primary copy.
 *
 * Whitelisted contexts (NOT touched):
 *  - text-white inside gradient/primary/dark backgrounds (background detected on same line)
 *  - text-white on icons inside gradient buttons (`Zap` etc.) — also detected by sibling bg
 *  - text-white inside the role-pill segment (active state)
 *
 * The script is intentionally conservative: each rule has a sibling-class guard.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'src')
const exts = ['.tsx', '.ts']

const DARK_BG_HINTS = [
  'bg-ink',
  'bg-black',
  'bg-surface-900',
  'bg-surface-950',
  'bg-primary-500',
  'bg-primary-600',
  'bg-primary-700',
  'bg-primary-800',
  'bg-accent-500',
  'bg-accent-600',
  'bg-accent-700',
  'bg-gradient-to-',
  'bg-red-600',
  'bg-rose-600',
  'bg-amber-600',
]

const isOnDarkSurface = (line) => DARK_BG_HINTS.some((hint) => line.includes(hint))

/**
 * Replacement rules. Each rule is a tuple [matchRegex, replacement, requireDark?]
 * "requireDark" = if true, only apply when line ALSO has a dark/gradient bg hint.
 * "requireLight" = if true, only apply when line does NOT have a dark/gradient bg hint.
 */
const rules = [
  // ---- H1 page titles ----
  // text-2xl font-bold text-white → premium light variant
  {
    test: /text-2xl\s+font-bold\s+text-white(\s|"|`)/g,
    replacement: 'text-2xl font-semibold tracking-tightest text-ink lg:text-3xl$1',
    requireLight: true,
  },
  {
    test: /text-3xl\s+font-bold\s+text-white(\s|"|`)/g,
    replacement: 'text-3xl font-semibold tracking-tightest text-ink lg:text-4xl$1',
    requireLight: true,
  },
  {
    test: /text-xl\s+font-bold\s+text-white(\s|"|`)/g,
    replacement: 'text-xl font-semibold text-ink$1',
    requireLight: true,
  },
  {
    test: /text-lg\s+font-bold\s+text-white(\s|"|`)/g,
    replacement: 'text-lg font-semibold text-ink$1',
    requireLight: true,
  },

  // ---- Generic font-semibold text-white on white card ----
  {
    test: /font-semibold\s+text-white(\s|"|`)/g,
    replacement: 'font-semibold text-ink$1',
    requireLight: true,
  },
  {
    test: /font-medium\s+text-white(\s|"|`)/g,
    replacement: 'font-medium text-ink$1',
    requireLight: true,
  },

  // ---- Subtitles using text-surface-400 ----
  // <p className="text-surface-400 mt-1"> → text-sm text-surface-500
  {
    test: /text-surface-400\s+mt-1(\s|"|`)/g,
    replacement: 'text-sm text-surface-500 mt-1$1',
    requireLight: true,
  },
  // Standalone "text-surface-400" in body text (not on icons)
  {
    test: /(text-sm|text-xs|text-base|text-lg)\s+text-surface-400(\s|"|`)/g,
    replacement: '$1 text-surface-500$2',
    requireLight: true,
  },
  // <p className="text-surface-400"> bare
  {
    test: /(className="[^"]*?\b)text-surface-400(\b[^"]*?")/g,
    replacement: (m, pre, post, _offset, full) => {
      // Skip if it's icon/decorative (Search, Mail, Lock + absolute classes)
      if (/absolute|pointer-events-none|placeholder|w-\d|h-\d/.test(pre + post)) return m
      return `${pre}text-surface-500${post}`
    },
    requireLight: true,
  },
]

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...(await walk(p)))
    else if (exts.includes(path.extname(e.name))) files.push(p)
  }
  return files
}

async function main() {
  const files = await walk(ROOT)
  let totalChanges = 0
  const touched = []

  for (const file of files) {
    const original = await fs.readFile(file, 'utf8')
    const lines = original.split('\n')
    let modified = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const dark = isOnDarkSurface(line)

      let next = line
      for (const rule of rules) {
        if (rule.requireLight && dark) continue
        if (rule.requireDark && !dark) continue

        if (typeof rule.replacement === 'function') {
          next = next.replace(rule.test, rule.replacement)
        } else {
          next = next.replace(rule.test, rule.replacement)
        }
      }

      if (next !== line) {
        lines[i] = next
        modified = true
        totalChanges += 1
      }
    }

    if (modified) {
      await fs.writeFile(file, lines.join('\n'), 'utf8')
      touched.push(path.relative(ROOT, file))
    }
  }

  console.log(`✓ touched ${touched.length} files, ${totalChanges} line(s) updated`)
  for (const f of touched) console.log('  ·', f)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
