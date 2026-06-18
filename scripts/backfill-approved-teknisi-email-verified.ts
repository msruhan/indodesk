/**
 * Backfill User.emailVerified untuk teknisi yang sudah disetujui admin
 * tapi belum pernah klik tautan verifikasi email.
 *
 * Usage: npx tsx scripts/backfill-approved-teknisi-email-verified.ts
 */
import { prisma } from '../src/lib/db'

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'TEKNISI',
      emailVerified: null,
      teknisiProfile: { isVerified: true },
    },
    select: { id: true, email: true },
  })

  if (users.length === 0) {
    console.log('Tidak ada teknisi yang perlu di-backfill.')
    return
  }

  const now = new Date()
  await prisma.user.updateMany({
    where: { id: { in: users.map((u) => u.id) } },
    data: { emailVerified: now },
  })

  console.log(`Backfill selesai untuk ${users.length} akun:`)
  for (const u of users) {
    console.log(`  - ${u.email}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
