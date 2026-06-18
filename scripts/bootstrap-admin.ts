/**
 * Create or promote the first production admin (no wipe, no full seed).
 *
 *   ADMIN_EMAIL=admin@bantoo.in ADMIN_PASSWORD='...' npx tsx scripts/bootstrap-admin.ts
 */
import { randomBytes } from 'crypto'
import { UserRole, PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL wajib di-set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@bantoo.in').trim().toLowerCase()
  const name = (process.env.ADMIN_NAME ?? 'Admin Bantoo').trim()
  let password = process.env.ADMIN_PASSWORD?.trim()
  const generated = !password

  if (!email || !email.includes('@')) {
    throw new Error('ADMIN_EMAIL tidak valid')
  }

  if (!password) {
    password = randomBytes(18).toString('base64url')
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD minimal 8 karakter')
  }

  const passwordHash = await hash(password, 12)
  const now = new Date()

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        role: UserRole.ADMIN,
        password: passwordHash,
        isActive: true,
        emailVerified: existing.emailVerified ?? now,
        mustChangePassword: true,
        lockedUntil: null,
      },
    })
    console.log(`✅ Admin diperbarui: ${email} (user id ${existing.id})`)
  } else {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: now,
        mustChangePassword: true,
      },
    })
    console.log(`✅ Admin dibuat: ${email} (user id ${user.id})`)
  }

  console.log('')
  console.log('Login production:')
  console.log(`  Email   : ${email}`)
  if (generated) {
    console.log(`  Password: ${password}`)
    console.log('')
    console.log('Simpan password ini — tidak ditampilkan lagi.')
  } else {
    console.log('  Password: (sesuai ADMIN_PASSWORD yang Anda set)')
  }
  console.log('')
  console.log('Catatan: mustChangePassword=true — ganti password setelah login pertama.')
}

main()
  .catch((e) => {
    console.error('❌ bootstrap-admin gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
