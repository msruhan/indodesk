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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: UserRole }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
} satisfies NextAuthConfig
