/**
 * One-time / idempotent migration: encrypt plaintext secrets in DB.
 *
 *   npx tsx scripts/encrypt-existing-secrets.ts
 *
 * Requires DATA_ENCRYPTION_KEY (32 bytes base64) in production.
 */
import { prisma } from '../src/lib/db'
import { encryptImeiApiKeyForStorage } from '../src/lib/crypto/imei-api-secret'
import { encryptTotpSecretForStorage } from '../src/lib/crypto/totp-secret'
import { isEncryptedValue } from '../src/lib/crypto/secret-field'
import { assertCryptoConfigured } from '../src/lib/crypto/encryption'

async function main() {
  assertCryptoConfigured()

  let totpUpdated = 0
  let totpSkipped = 0
  let apiUpdated = 0
  let apiSkipped = 0

  const users = await prisma.user.findMany({
    where: { twoFactorSecret: { not: null } },
    select: { id: true, twoFactorSecret: true },
  })

  for (const user of users) {
    const raw = user.twoFactorSecret
    if (!raw || isEncryptedValue(raw)) {
      totpSkipped++
      continue
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: encryptTotpSecretForStorage(raw) },
    })
    totpUpdated++
  }

  const apis = await prisma.imeiApi.findMany({
    select: { id: true, apiKey: true },
  })

  for (const api of apis) {
    if (isEncryptedValue(api.apiKey)) {
      apiSkipped++
      continue
    }
    await prisma.imeiApi.update({
      where: { id: api.id },
      data: { apiKey: encryptImeiApiKeyForStorage(api.apiKey) },
    })
    apiUpdated++
  }

  console.log('Encrypt existing secrets — done')
  console.log(`  User.twoFactorSecret: ${totpUpdated} encrypted, ${totpSkipped} skipped`)
  console.log(`  ImeiApi.apiKey:       ${apiUpdated} encrypted, ${apiSkipped} skipped`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
