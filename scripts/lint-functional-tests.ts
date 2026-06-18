/**
 * Lint Functional Test Documentation
 *
 * Validates the FunctionalTestDoc package at `indoteknizi/docs/functional-tests/`
 * against rules FT-001..FT-010 defined in the design document.
 *
 * Usage:
 *   npx tsx scripts/lint-functional-tests.ts
 *
 * Exit codes:
 *   0 — all rules pass
 *   1 — at least one rule violation found
 *
 * Output format per violation:
 *   [FT-LINT] <file>:<line>  <RULE_ID>  <message>
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'

// ------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------

type Violation = {
  file: string
  line: number
  ruleId: string
  message: string
}

type ParsedTestCase = {
  id: string
  title: string
  file: string
  line: number
  /** raw markdown lines that belong to this test case (until next ### or ## heading) */
  body: string[]
  /** detected format */
  format: 'detailed' | 'gwt' | 'unknown'
  tags: string[]
}

type ParsedFile = {
  path: string
  name: string
  lines: string[]
  testCases: ParsedTestCase[]
}

// ------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------

const DOCS_DIR = join(process.cwd(), 'docs', 'functional-tests')

const TEST_ID_RE = /^FT-[A-Z]+-\d{3}$/
const FILE_NAME_RE = /^(0[0-9]|1[0-3])-[a-z0-9-]+\.md$/

const ALLOWED_PRIORITIES = new Set(['P0', 'P1', 'P2'])

const FORBIDDEN_CODE_LANGS = new Set([
  'playwright',
  'jest',
  'vitest',
  'cypress',
  'puppeteer',
  'mocha',
  'tap',
])

const SEED_ALIASES = ['admin', 'teknisi1', 'teknisi2', 'user1', 'user2', 'user3']
const SEED_EMAILS = [
  'admin@indoteknizi.com',
  'ahmad@indoteknizi.com',
  'budi@indoteknizi.com',
  'siti@gmail.com',
  'rudi@gmail.com',
  'dewi@gmail.com',
]
const SEED_NAMES = [
  'Admin IndoTeknizi',
  'Ahmad Hidayat',
  'Budi Santoso',
  'Siti Nurhaliza',
  'Rudi Hartono',
  'Dewi Lestari',
  'admin',
  'ahmad',
  'budi',
  'siti',
  'rudi',
  'dewi',
]

const REQUIRED_DETAILED_FIELDS = [
  'Role',
  'Priority',
  'Preconditions',
  // "Test Data" is optional only when Steps inline test data — but design requires it
  'Steps',
  'Expected Result',
]

const OVERVIEW_FILE = '00-overview.md'
const CROSS_FILE = '13-cross-role-flows.md'

// ------------------------------------------------------------------------------------
// Parsing
// ------------------------------------------------------------------------------------

function readDocsFiles(): ParsedFile[] {
  let entries: string[]
  try {
    entries = readdirSync(DOCS_DIR)
  } catch (error) {
    console.error(`[FT-LINT] cannot read directory ${DOCS_DIR}: ${(error as Error).message}`)
    process.exit(2)
  }

  const mdFiles = entries.filter((e) => e.endsWith('.md')).sort()
  return mdFiles.map((name) => {
    const path = join(DOCS_DIR, name)
    const text = readFileSync(path, 'utf8')
    const lines = text.split('\n')
    const testCases = parseTestCases(name, lines)
    return { path, name, lines, testCases }
  })
}

function parseTestCases(fileName: string, lines: string[]): ParsedTestCase[] {
  const cases: ParsedTestCase[] = []

  // Skip example test cases inside the Konvensi section of OverviewDoc
  // (example IDs use prefix EXAMPLE — e.g. FT-EXAMPLE-001)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(/^### (FT-[A-Z]+-\d{3})\s*(?:—|-|–)?\s*(.*)$/)
    if (!headingMatch) continue

    const id = headingMatch[1]
    const title = headingMatch[2].trim()

    // collect body until next heading (##, ###, or end)
    const body: string[] = []
    let j = i + 1
    for (; j < lines.length; j++) {
      const next = lines[j]
      if (/^##\s/.test(next) || /^###\s/.test(next)) break
      body.push(next)
    }

    const format = detectFormat(body)
    const tags = detectTags(line + '\n' + body.join('\n'))

    cases.push({
      id,
      title,
      file: fileName,
      line: i + 1, // 1-indexed
      body,
      format,
      tags,
    })
  }

  return cases
}

function detectFormat(body: string[]): ParsedTestCase['format'] {
  const text = body.join('\n')
  const hasGiven = /\*\*Given\*\*/i.test(text)
  const hasWhen = /\*\*When\*\*/i.test(text)
  const hasThen = /\*\*Then\*\*/i.test(text)
  const hasSteps = /\*\*Steps\*\*/i.test(text)
  const hasExpected = /\*\*Expected Result\*\*/i.test(text)

  if (hasGiven && hasWhen && hasThen) return 'gwt'
  if (hasSteps && hasExpected) return 'detailed'
  return 'unknown'
}

function detectTags(text: string): string[] {
  const tags: string[] = []
  if (/\[NEGATIVE\]/.test(text)) tags.push('NEGATIVE')
  if (/\[EDGE\]/.test(text)) tags.push('EDGE')
  if (/\[RBAC\]/.test(text)) tags.push('RBAC')
  return tags
}

function fieldExists(body: string[], field: string): boolean {
  // Look for "- **<field>**:" or "**<field>**:" anywhere in body
  const re = new RegExp(`\\*\\*${escapeRegExp(field)}\\*\\*\\s*:`, 'i')
  return body.some((line) => re.test(line))
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ------------------------------------------------------------------------------------
// Rules
// ------------------------------------------------------------------------------------

function ruleFT001_TestCaseIdRegex(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    for (const tc of file.testCases) {
      if (!TEST_ID_RE.test(tc.id)) {
        violations.push({
          file: file.name,
          line: tc.line,
          ruleId: 'FT-001',
          message: `TestCaseID "${tc.id}" tidak match regex ^FT-[A-Z]+-\\d{3}$`,
        })
      }
    }
  }
  return violations
}

function ruleFT002_GlobalUniqueness(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  const idMap = new Map<string, { file: string; line: number }[]>()

  for (const file of files) {
    for (const tc of file.testCases) {
      // Skip example IDs (FT-EXAMPLE-*) used only for documentation in OverviewDoc
      if (tc.id.startsWith('FT-EXAMPLE-')) continue
      const list = idMap.get(tc.id) ?? []
      list.push({ file: file.name, line: tc.line })
      idMap.set(tc.id, list)
    }
  }

  for (const [id, occurrences] of idMap) {
    if (occurrences.length > 1) {
      for (const occ of occurrences) {
        violations.push({
          file: occ.file,
          line: occ.line,
          ruleId: 'FT-002',
          message: `TestCaseID "${id}" duplikat lintas paket (terdefinisi di ${occurrences
            .map((o) => `${o.file}:${o.line}`)
            .join(', ')})`,
        })
      }
    }
  }

  return violations
}

function ruleFT003_DetailedRequiredFields(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    // skip OverviewDoc since its example test cases use FT-EXAMPLE prefix
    if (file.name === OVERVIEW_FILE) continue
    for (const tc of file.testCases) {
      if (tc.format !== 'detailed') continue
      for (const field of REQUIRED_DETAILED_FIELDS) {
        if (!fieldExists(tc.body, field)) {
          violations.push({
            file: file.name,
            line: tc.line,
            ruleId: 'FT-003',
            message: `DetailedTestCase "${tc.id}" kekurangan field wajib "${field}"`,
          })
        }
      }
    }
  }
  return violations
}

function ruleFT004_GwtLabels(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    if (file.name === OVERVIEW_FILE) continue
    for (const tc of file.testCases) {
      if (tc.format !== 'gwt') continue
      const text = tc.body.join('\n')
      const missing: string[] = []
      if (!/\*\*Given\*\*/i.test(text)) missing.push('Given')
      if (!/\*\*When\*\*/i.test(text)) missing.push('When')
      if (!/\*\*Then\*\*/i.test(text)) missing.push('Then')
      if (missing.length > 0) {
        violations.push({
          file: file.name,
          line: tc.line,
          ruleId: 'FT-004',
          message: `GWTChecklist "${tc.id}" kekurangan label: ${missing.join(', ')}`,
        })
      }
    }
  }
  return violations
}

function ruleFT005_StructuralSections(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    if (file.name === OVERVIEW_FILE) continue
    const text = file.lines.join('\n')
    if (!/^## Ringkasan/m.test(text)) {
      violations.push({
        file: file.name,
        line: 1,
        ruleId: 'FT-005',
        message: 'DomainDoc kekurangan section "## Ringkasan"',
      })
    }
    if (!/^## Catatan QA/m.test(text)) {
      violations.push({
        file: file.name,
        line: 1,
        ruleId: 'FT-005',
        message: 'DomainDoc kekurangan section "## Catatan QA"',
      })
    } else {
      // Verify Catatan QA contains at least one src/ reference
      const noteIdx = file.lines.findIndex((l) => /^## Catatan QA/.test(l))
      if (noteIdx >= 0) {
        const noteText = file.lines.slice(noteIdx).join('\n')
        if (!/`src\//.test(noteText) && file.name !== CROSS_FILE) {
          violations.push({
            file: file.name,
            line: noteIdx + 1,
            ruleId: 'FT-005',
            message: 'Section "Catatan QA" tidak mereferensikan path `src/...`',
          })
        }
      }
    }
  }
  return violations
}

function ruleFT006_NoDuplicateSeedTable(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    if (file.name === OVERVIEW_FILE) continue
    file.lines.forEach((line, idx) => {
      // detect H2 like "## Seed Accounts"
      if (/^##\s+Seed Accounts/i.test(line)) {
        violations.push({
          file: file.name,
          line: idx + 1,
          ruleId: 'FT-006',
          message: 'DomainDoc menduplikasi heading "Seed Accounts" (referensikan ke 00-overview.md)',
        })
      }
    })
  }
  return violations
}

function ruleFT007_NoAutomationCodeFences(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    file.lines.forEach((line, idx) => {
      const m = line.match(/^```([a-zA-Z0-9_-]+)/)
      if (m) {
        const lang = m[1].toLowerCase()
        if (FORBIDDEN_CODE_LANGS.has(lang)) {
          violations.push({
            file: file.name,
            line: idx + 1,
            ruleId: 'FT-007',
            message: `Code fence dengan bahasa otomatisasi terlarang: "${lang}"`,
          })
        }
      }
    })
  }
  return violations
}

function ruleFT008_PriorityValues(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    if (file.name === OVERVIEW_FILE) continue
    for (const tc of file.testCases) {
      if (tc.format !== 'detailed') continue
      const priorityLine = tc.body.find((l) => /\*\*Priority\*\*\s*:/i.test(l))
      if (!priorityLine) continue
      const m = priorityLine.match(/\*\*Priority\*\*\s*:\s*([A-Z0-9]+)/i)
      if (m) {
        const value = m[1].toUpperCase()
        if (!ALLOWED_PRIORITIES.has(value)) {
          violations.push({
            file: file.name,
            line: tc.line,
            ruleId: 'FT-008',
            message: `Priority "${value}" tidak valid (harus salah satu dari ${[...ALLOWED_PRIORITIES].join(', ')})`,
          })
        }
      }
    }
  }
  return violations
}

function ruleFT009_DomainCoverageMinimums(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    if (file.name === OVERVIEW_FILE || file.name === CROSS_FILE) continue
    const negativeCount = file.testCases.filter((tc) => tc.tags.includes('NEGATIVE')).length
    const rbacCount = file.testCases.filter((tc) => tc.tags.includes('RBAC')).length
    if (negativeCount < 3) {
      violations.push({
        file: file.name,
        line: 1,
        ruleId: 'FT-009',
        message: `DomainDoc hanya memiliki ${negativeCount} skenario [NEGATIVE] (minimum 3)`,
      })
    }
    if (rbacCount < 1) {
      violations.push({
        file: file.name,
        line: 1,
        ruleId: 'FT-009',
        message: `DomainDoc tidak memiliki skenario [RBAC] (minimum 1)`,
      })
    }
  }

  // CrossRoleDoc: minimum 5 RBAC matrix rows
  const crossFile = files.find((f) => f.name === CROSS_FILE)
  if (crossFile) {
    const text = crossFile.lines.join('\n')
    const matrixSection = text.split(/^##\s+RBAC Cross-Role Matrix/m)[1] ?? ''
    // Count rows that look like a markdown table data row "| <something> |"
    const rows = matrixSection
      .split('\n')
      .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    if (rows.length < 5) {
      violations.push({
        file: crossFile.name,
        line: 1,
        ruleId: 'FT-009',
        message: `RBAC Cross-Role Matrix hanya ${rows.length} baris (minimum 5)`,
      })
    }
  }

  return violations
}

function ruleFT010_DetailedReferencesSeedAccount(files: ParsedFile[]): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    if (file.name === OVERVIEW_FILE) continue
    for (const tc of file.testCases) {
      if (tc.format !== 'detailed') continue
      const text = tc.body.join('\n')
      const hasAlias = SEED_ALIASES.some((a) => new RegExp(`\\b${a}\\b`, 'i').test(text))
      const hasEmail = SEED_EMAILS.some((e) => text.includes(e))
      const hasName = SEED_NAMES.some((n) => text.includes(n))
      if (!hasAlias && !hasEmail && !hasName) {
        violations.push({
          file: file.name,
          line: tc.line,
          ruleId: 'FT-010',
          message: `DetailedTestCase "${tc.id}" tidak mereferensikan SeedAccount manapun di Preconditions/Test Data`,
        })
      }
    }
  }
  return violations
}

// ------------------------------------------------------------------------------------
// Reporter
// ------------------------------------------------------------------------------------

function printViolations(violations: Violation[]): void {
  for (const v of violations) {
    console.log(`[FT-LINT] ${v.file}:${v.line}  ${v.ruleId}  ${v.message}`)
  }
}

function summarize(violations: Violation[], totalFiles: number, totalCases: number): void {
  const byRule = new Map<string, number>()
  for (const v of violations) {
    byRule.set(v.ruleId, (byRule.get(v.ruleId) ?? 0) + 1)
  }
  console.log('')
  console.log('=== FT-LINT Summary ===')
  console.log(`Files scanned:     ${totalFiles}`)
  console.log(`Test cases parsed: ${totalCases}`)
  console.log(`Violations:        ${violations.length}`)
  if (violations.length > 0) {
    console.log('Per rule:')
    const sortedRules = [...byRule.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    for (const [rule, count] of sortedRules) {
      console.log(`  ${rule}: ${count}`)
    }
  } else {
    console.log('Result:            ✅ All rules pass')
  }
}

// ------------------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------------------

function main(): number {
  const files = readDocsFiles()
  const totalCases = files.reduce((sum, f) => sum + f.testCases.length, 0)

  // Property 1 sanity (handled inside ruleFT-005-like): 14 files, naming convention
  for (const f of files) {
    if (!FILE_NAME_RE.test(f.name)) {
      console.log(
        `[FT-LINT] ${f.name}:1  FT-000  Nama file "${f.name}" tidak match pola ^(0[0-9]|1[0-3])-[a-z0-9-]+\\.md$`,
      )
    }
  }
  if (files.length !== 14) {
    console.log(
      `[FT-LINT] (root):0  FT-000  Jumlah file dokumentasi ${files.length} ≠ 14 (expected exactly 14)`,
    )
  }

  const violations: Violation[] = [
    ...ruleFT001_TestCaseIdRegex(files),
    ...ruleFT002_GlobalUniqueness(files),
    ...ruleFT003_DetailedRequiredFields(files),
    ...ruleFT004_GwtLabels(files),
    ...ruleFT005_StructuralSections(files),
    ...ruleFT006_NoDuplicateSeedTable(files),
    ...ruleFT007_NoAutomationCodeFences(files),
    ...ruleFT008_PriorityValues(files),
    ...ruleFT009_DomainCoverageMinimums(files),
    ...ruleFT010_DetailedReferencesSeedAccount(files),
  ]

  printViolations(violations)
  summarize(violations, files.length, totalCases)

  return violations.length > 0 ? 1 : 0
}

const exitCode = main()
process.exit(exitCode)
