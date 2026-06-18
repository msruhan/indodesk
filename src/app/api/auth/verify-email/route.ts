import { NextResponse } from 'next/server'
import { confirmEmailVerification } from '@/lib/email-verification'
import { prisma } from '@/lib/db'
import { accountPathForRole } from '@/lib/role-routes'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')?.trim()
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/user/akun?verify=missing`)
  }

  const result = await confirmEmailVerification(token)
  if (!result.ok) {
    return NextResponse.redirect(`${baseUrl}/user/akun?verify=invalid`)
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { role: true },
  })
  const accountPath = accountPathForRole(user?.role ?? 'USER')

  return NextResponse.redirect(`${baseUrl}${accountPath}?verify=success`)
}
