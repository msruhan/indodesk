/**
 * Functional Full Test — mengeksekusi SEMUA skenario dari dokumentasi
 * `docs/functional-tests/01..13` via HTTP API (agent-assisted, tanpa klik manual).
 *
 * Prasyarat:
 *   - PostgreSQL + `npm run db:seed` + `npm run stress:seed`
 *   - STRESS_TEST_MODE=true
 *   - `npm run dev` di port 3000
 *
 * Usage:
 *   npm run test:ft:full
 *   npx tsx scripts/functional-full-test.ts [--base http://localhost:3000]
 */

import { parseAllDocTestCases } from './ft/parse-docs'
import { createHandlerMap } from './ft/handlers'
import {
  BASE_URL,
  generateReport,
  results,
  runTest,
  skip,
  writeReport,
} from './ft/lib'

async function main(): Promise<number> {
  const docCases = parseAllDocTestCases()
  const handlers = createHandlerMap()

  console.log(`Functional Full Test — base ${BASE_URL}`)
  console.log(`Dokumentasi: ${docCases.length} skenario (01–13, tanpa contoh overview)`)
  console.log(`Handler terdaftar: ${handlers.size}`)
  console.log('============================================================')

  try {
    const ping = await fetch(`${BASE_URL}/`)
    if (ping.status >= 500) {
      console.error(`Server returned ${ping.status}. Aborting.`)
      return 2
    }
  } catch (error) {
    console.error(`Cannot reach ${BASE_URL}: ${(error as Error).message}`)
    console.error('Jalankan `npm run dev` terlebih dahulu.')
    return 2
  }

  let lastFile = ''
  for (const tc of docCases) {
    if (tc.file !== lastFile) {
      lastFile = tc.file
      console.log(`\n=== ${tc.file} ===`)
    }
    const fn = handlers.get(tc.id)
    await runTest(tc.id, tc.title, tc.file, async () => {
      if (!fn) {
        skip('Belum ada handler di runner — tambahkan di scripts/ft/handlers/')
      }
      await fn()
    })
  }

  // Handler terdaftar tapi tidak ada di docs (smoke legacy ids) — abaikan

  const missingInRegistry = docCases.filter((tc) => !handlers.has(tc.id))
  if (missingInRegistry.length > 0) {
    console.log(`\n⚠️  ${missingInRegistry.length} skenario docs tanpa handler eksplisit (akan SKIP):`)
    for (const m of missingInRegistry.slice(0, 10)) {
      console.log(`   - ${m.id}`)
    }
    if (missingInRegistry.length > 10) console.log(`   ... dan ${missingInRegistry.length - 10} lainnya`)
  }

  console.log('')
  console.log('============================================================')
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const skipped = results.filter((r) => r.status === 'SKIP').length
  console.log(`Total: ${results.length}  Pass: ${passed}  Fail: ${failed}  Skip: ${skipped}`)

  const report = generateReport({
    mode: 'API full suite (agent-assisted, semua skenario dokumentasi)',
    totalFromDocs: docCases.length,
  })
  const reportPath = writeReport(report, 'full-run')
  console.log(`\nReport: ${reportPath}`)

  return failed > 0 ? 1 : 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Fatal:', err)
    process.exit(2)
  })
