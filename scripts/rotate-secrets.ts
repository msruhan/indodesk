/**
 * Print freshly generated secrets for rotation (does not write .env).
 *
 *   npx tsx scripts/rotate-secrets.ts
 */
import { randomBytes } from 'node:crypto'

function genBase64Secret(): string {
  return randomBytes(32).toString('base64')
}

const authSecret = genBase64Secret()
const dataKey = genBase64Secret()

console.log('')
console.log('=== IndoTeknizi secret rotation ===')
console.log('')
console.log('1. Generate new values (copy to your secrets manager / .env):')
console.log('')
console.log(`AUTH_SECRET="${authSecret}"`)
console.log(`DATA_ENCRYPTION_KEY="${dataKey}"`)
console.log('')
console.log('2. Rollout AUTH_SECRET:')
console.log('   - Deploy new AUTH_SECRET to all app instances')
console.log('   - Existing sessions will be invalidated (users re-login)')
console.log('   - No DB migration required')
console.log('')
console.log('3. Rollout DATA_ENCRYPTION_KEY (envelope encryption):')
console.log('   - STOP: rotating KEK without re-encryption makes existing ciphertext unreadable')
console.log('   - Export/decrypt all encrypted fields with OLD key, re-encrypt with NEW key')
console.log('   - Or run dual-key migration (not automated in this script)')
console.log('   - For first-time setup only, set DATA_ENCRYPTION_KEY then run:')
console.log('        npx tsx scripts/encrypt-existing-secrets.ts')
console.log('')
console.log('4. Verify after deploy:')
console.log('   - npm run build')
console.log('   - Login + 2FA + IMEI supplier sync smoke test')
console.log('')
