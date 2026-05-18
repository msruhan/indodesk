import type { NextAuthConfig } from 'next-auth'

type UserRole = 'ADMIN' | 'TEKNISI' | 'USER'

/**
 * Edge-compatible Auth.js config (no Prisma, bcrypt, or DB).
 * Used by proxy.ts only. Full config lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: UserRole }).role
        if (user.name) token.name = user.name
        if (user.image) token.picture = user.image
      }
      if (trigger === 'update' && session) {
        const patch = session as { name?: string; image?: string | null }
        if (patch.name) token.name = patch.name
        if (patch.image !== undefined) token.picture = patch.image ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
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
