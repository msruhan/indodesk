import type { NextAuthConfig } from 'next-auth'
import { getCachedSessionVersion } from '@/lib/session-version-cache'
import {
  isSessionIdleExpired,
  SESSION_IDLE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from '@/lib/auth/session-policy'

type UserRole = 'ADMIN' | 'TEKNISI' | 'USER'

function touchSessionActivity(token: Record<string, unknown>): void {
  token.lastActivity = Math.floor(Date.now() / 1000)
}

/**
 * Edge-compatible Auth.js config (no Prisma, bcrypt, or DB).
 * Used by proxy.ts only. Full config lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_IDLE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const now = Math.floor(Date.now() / 1000)

      if (user) {
        token.id = user.id
        token.role = (user as { role?: UserRole }).role
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0
        token.isActive = true
        if (user.name) token.name = user.name
        if (user.image) token.picture = user.image
        touchSessionActivity(token as Record<string, unknown>)
      } else {
        const last =
          (token.lastActivity as number | undefined) ?? (token.iat as number | undefined)
        if (last !== undefined && isSessionIdleExpired(last, now)) {
          return null as unknown as typeof token
        }
        touchSessionActivity(token as Record<string, unknown>)
      }

      if (token.id) {
        if (token.isActive === false) {
          return null as unknown as typeof token
        }
        const cached = await getCachedSessionVersion(token.id as string)
        if (
          cached !== null &&
          typeof token.sessionVersion === 'number' &&
          cached !== token.sessionVersion
        ) {
          return null as unknown as typeof token
        }
      }

      if (trigger === 'update' && session) {
        const patch = session as { name?: string; image?: string | null }
        if (patch.name) token.name = patch.name
        if (patch.image !== undefined) token.picture = patch.image ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (!token?.id) {
        return { expires: session.expires } as typeof session
      }
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.mustChangePassword = Boolean(token.mustChangePassword)
        ;(session as { sessionVersion?: number }).sessionVersion = token.sessionVersion as number | undefined
        if (token.name) session.user.name = token.name as string
        if (token.picture) session.user.image = token.picture as string
        else if (token.picture === undefined && token.sub) {
          // keep existing session image when not in token
        }
      }
      return session
    },
  },
} satisfies NextAuthConfig
