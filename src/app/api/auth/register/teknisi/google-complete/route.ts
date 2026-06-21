import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractRequestContext, logAccountEvent } from '@/lib/activity-log'
import { getClientIp, RATE_LIMITS, rateLimitResponse, withRateLimit } from '@/lib/rate-limit-store'
import {
  buildApplicationData,
  teknisiRegisterProfileSchema,
} from '@/lib/teknisi-registration'
import {
  clearTeknisiRegisterCompleteCookie,
  readTeknisiRegisterCompleteUserId,
} from '@/lib/auth/google-register-cookie'
import {
  COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE,
  isComingSoonEnabled,
} from '@/lib/coming-soon-server'

export async function POST(req: Request) {
  if (await isComingSoonEnabled()) {
    return NextResponse.json(
      { success: false, error: COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE, code: 'COMING_SOON' },
      { status: 503 },
    )
  }

  const ip = getClientIp(req)
  const rl = await withRateLimit(req, ['auth', 'register-teknisi-google', ip], RATE_LIMITS.auth)
  if (!rl.allowed) {
    return rateLimitResponse(rl)
  }

  try {
    const userId = await readTeknisiRegisterCompleteUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Sesi pendaftaran Google habis. Silakan mulai ulang.' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const parsed = teknisiRegisterProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const data = parsed.data
    const phone = data.phone.replace(/\s/g, '')

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        teknisiProfile: { select: { id: true } },
      },
    })

    if (!user || user.role !== 'TEKNISI' || user.password || user.teknisiProfile) {
      return NextResponse.json(
        { success: false, error: 'Sesi pendaftaran tidak valid. Silakan mulai ulang.' },
        { status: 403 },
      )
    }

    const applicationData = buildApplicationData(data)
    const specialty = data.specialty.map((s) => s.trim()).filter(Boolean)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        isActive: false,
        teknisiProfile: {
          create: {
            specialty,
            experience: data.experience.trim(),
            location: data.location.trim(),
            description: data.motivation.trim(),
            isVerified: false,
            verificationStatus: 'PENDING',
            applicationData: applicationData as object,
          },
        },
      },
    })

    await clearTeknisiRegisterCompleteCookie()

    const ctx = extractRequestContext(req)
    void logAccountEvent({
      action: 'account.register',
      severity: 'SUCCESS',
      summary: `Pendaftaran teknisi via Google (menunggu approval): ${user.name}`,
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      target: { type: 'user', id: user.id, label: user.email },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { role: user.role, verificationStatus: 'PENDING', provider: 'google' },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          message:
            'Pendaftaran berhasil. Tim admin akan meninjau aplikasi Anda. Anda dapat login setelah disetujui.',
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[REGISTER_TEKNISI_GOOGLE_COMPLETE]', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
