import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { SESSION_STALE_CODE } from '@/lib/api-constants'

export { SESSION_STALE_CODE }

/** Authenticated session for API routes (avoid inferring from middleware `auth` overload). */
export type ApiSession = Session & {
  user: NonNullable<Session['user']> & { id: string; role: UserRole }
}

/**
 * Helper that returns the current session for API routes.
 * Returns null if not authenticated.
 */
export async function getApiSession() {
  return await auth()
}

/**
 * Require authentication in an API route.
 * Returns a NextResponse if unauthorized, or the session if authorized.
 */
export async function requireApiAuth():
  Promise<{ session: ApiSession; error: null } | { session: null; error: NextResponse }> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      ),
    }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true, email: true, image: true },
  })

  if (!dbUser) {
    return {
      session: null,
      error: NextResponse.json(
        {
          success: false,
          error:
            'Sesi login sudah tidak valid (database di-reset). Silakan logout lalu login kembali.',
          code: SESSION_STALE_CODE,
        },
        { status: 401 },
      ),
    }
  }

  const apiSession: ApiSession = {
    ...session,
    user: {
      ...session.user,
      id: dbUser.id,
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email ?? session.user.email ?? '',
      image: dbUser.image ?? session.user.image ?? null,
    },
  }

  return { session: apiSession, error: null }
}

/**
 * Require a specific role in an API route.
 * Returns a NextResponse if unauthorized, or the session if authorized.
 */
export async function requireApiRole(roles: UserRole[]):
  Promise<{ session: ApiSession; error: null } | { session: null; error: NextResponse }> {
  const result = await requireApiAuth()
  if (result.error) return result

  const userRole = result.session.user.role as UserRole
  if (!roles.includes(userRole)) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 },
      ),
    }
  }

  return result
}

/**
 * Standard JSON success response.
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Standard JSON error response.
 */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}
