import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeAdminUser } from '@/lib/admin-user-serializer'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(30).optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const users = await prisma.user.findMany({
      where: { role: UserRole.USER },
      include: { _count: { select: { ordersAsBuyer: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(users.map(serializeAdminUser))
  } catch (e) {
    console.error('[ADMIN_USERS_GET]', e)
    return apiError('Gagal memuat user', 500)
  }
}

export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data
    const email = data.email.trim().toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return apiError('Email sudah terdaftar', 409)

    const passwordHash = await hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: passwordHash,
        phone: data.phone?.trim() || null,
        role: UserRole.USER,
        isActive: data.isActive ?? true,
        passwordChangedAt: new Date(),
      },
      include: { _count: { select: { ordersAsBuyer: true } } },
    })

    await prisma.wallet.create({ data: { userId: user.id, balance: 0 } })

    return apiSuccess(serializeAdminUser(user), 201)
  } catch (e) {
    console.error('[ADMIN_USERS_POST]', e)
    return apiError('Gagal menambah user', 500)
  }
}
