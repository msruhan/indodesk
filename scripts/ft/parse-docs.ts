/**
 * Parse FunctionalTestDoc markdown files (same rules as lint-functional-tests).
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export type DocTestCase = {
  id: string
  title: string
  file: string
  line: number
  tags: string[]
}

const DOCS_DIR = join(process.cwd(), 'docs', 'functional-tests')

export function parseAllDocTestCases(): DocTestCase[] {
  const entries = readdirSync(DOCS_DIR).filter((e) => e.endsWith('.md')).sort()
  const all: DocTestCase[] = []

  for (const name of entries) {
    if (name === '00-overview.md') continue // skip examples only file
    const lines = readFileSync(join(DOCS_DIR, name), 'utf8').split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const headingMatch = line.match(/^### (FT-[A-Z]+-\d{3})\s*(?:—|-|–)?\s*(.*)$/)
      if (!headingMatch) continue
      const id = headingMatch[1]
      if (id.includes('EXAMPLE')) continue
      const title = headingMatch[2].trim()
      const tags: string[] = []
      if (/\[NEGATIVE\]/i.test(line + title)) tags.push('NEGATIVE')
      if (/\[EDGE\]/i.test(line + title)) tags.push('EDGE')
      if (/\[RBAC\]/i.test(line + title)) tags.push('RBAC')
      all.push({ id, title, file: name, line: i + 1, tags })
    }
  }

  return all
}
