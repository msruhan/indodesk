import { parseAllDocTestCases } from './ft/parse-docs'
import { createHandlerMap } from './ft/handlers'
import { runTest, results, generateReport, writeReport } from './ft/lib'

async function main() {
  const handlers = createHandlerMap()
  const cases = parseAllDocTestCases().filter((c) => c.id.startsWith('FT-CROSS-'))

  for (const tc of cases) {
    const fn = handlers.get(tc.id)
    if (!fn) {
      await runTest(tc.id, tc.title, tc.file, async () => {
        throw new Error('SKIP: no handler')
      })
      continue
    }
    await runTest(tc.id, tc.title, tc.file, fn)
  }

  const path = writeReport(
    generateReport({ mode: 'batch13-cross-role-api', totalFromDocs: cases.length }),
    'batch13-cross-role-api',
  )
  const pass = results.filter((r) => r.status === 'PASS').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  const skip = results.filter((r) => r.status === 'SKIP').length
  console.log(`\nReport: ${path}`)
  console.log(`PASS=${pass} FAIL=${fail} SKIP=${skip}`)
  process.exit(fail > 0 ? 1 : 0)
}

void main()
