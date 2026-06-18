import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { serializeAdminTeknisi } from '@/lib/admin-user-serializer'
import { buildTeknisiApprovalUserData } from '@/lib/teknisi-admin-approval'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(30).optional(),
  specialty: z.string().optional(),
  experience: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  description: z.string().max(5000).optional(),
  isVerified: z.boolean().optional(),
  price: z.number().min(0).optional(),
})

function parseSpecialty(raw?: string): string[] {
  if (!raw?.trim()) return ['Service HP']
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const users = await prisma.user.findMany({
      where: { role: UserRole.TEKNISI },
      include: { teknisiProfile: true },
      orderBy: { createdAt: 'desc' },
    })

    const data = users
      .map(serializeAdminTeknisi)
      .filter((t): t is NonNullable<typeof t> => t !== null)

    return apiSuccess(data)
  } catch (e) {
    console.error('[ADMIN_TEKNISI_GET]', e)
    return apiError('Gagal memuat teknisi', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
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
    const isVerified = data.isVerified ?? false

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: passwordHash,
        phone: data.phone?.trim() || null,
        role: UserRole.TEKNISI,
        passwordChangedAt: new Date(),
        ...(isVerified ? buildTeknisiApprovalUserData(null) : { isActive: false }),
        teknisiProfile: {
          create: {
            specialty: parseSpecialty(data.specialty),
            experience: data.experience?.trim() || null,
            location: data.location?.trim() || null,
            description: data.description?.trim() || null,
            isVerified,
            verificationStatus: isVerified ? 'APPROVED' : 'PENDING',
            price: data.price ?? 50000,
          },
        },
      },
      include: { teknisiProfile: true },
    })

    await prisma.wallet.create({ data: { userId: user.id, balance: 0 } })

    const dto = serializeAdminTeknisi(user)
    if (!dto) return apiError('Gagal membuat profil teknisi', 500)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.teknisi.create',
      summary: `Admin membuat teknisi ${user.email}`,
      severity: 'WARNING',
      target: { type: 'teknisi', id: user.id, label: user.email },
    })

    return apiSuccess(dto, 201)
  } catch (e) {
    console.error('[ADMIN_TEKNISI_POST]', e)
    return apiError('Gagal menambah teknisi', 500)
  }
}
