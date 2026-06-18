/**
 * Jalankan semua batch runner FT (batch 2–13 per domain) secara berurutan.
 * Batch 1 (auth) dan marketplace core termasuk di `npm run test:ft:full`.
 *
 * Usage: TMPDIR=.tmp npx tsx scripts/run-all-ft-batches.ts
 */

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const RUNNERS = [
  'run-rekber-ft.ts',
  'run-topup-ft.ts',
  'run-konsultasi-ft.ts',
  'run-remote-ft.ts',
  'run-imei-ft.ts',
  'run-server-ft.ts',
  'run-inspection-ft.ts',
  'run-wallet-chat-notif-ft.ts',
  'run-store-ft.ts',
  'run-admin-ft.ts',
  'run-cross-ft.ts',
] as const

function main(): number {
  const env = { ...process.env, TMPDIR: process.env.TMPDIR ?? '.tmp' }
  let failed = 0

  console.log('=== IndoTeknizi — All FT batch runners ===\n')

  for (const script of RUNNERS) {
    console.log(`\n>>> ${script}`)
    const r = spawnSync('npx', ['tsx', join('scripts', script)], {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
      shell: false,
    })
    if (r.status !== 0) {
      failed += 1
      console.error(`<<< FAILED: ${script} (exit ${r.status ?? 1})`)
    } else {
      console.log(`<<< OK: ${script}`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Batches failed: ${failed} / ${RUNNERS.length}`)
  if (failed === 0) {
    console.log('Semua batch runner lulus. Jalankan `npm run test:ft:full` untuk suite dokumentasi lengkap.')
  }
  return failed > 0 ? 1 : 0
}

process.exit(main())
