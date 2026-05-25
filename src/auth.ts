import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { verifyTotpCode } from '@/lib/totp'
import { authConfig } from '@/auth.config'
import { evaluateLoginFailure, logAuthEvent } from '@/lib/activity-log'
import { checkTeknisiLoginGuard } from '@/lib/teknisi-login-guard'
import { setTeknisiPresence } from '@/lib/teknisi-presence'

const googleClientId = process.env.AUTH_GOOGLE_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET
const googleEnabled = Boolean(googleClientId && googleClientSecret)

export const isGoogleAuthEnabled = googleEnabled

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as never,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.id) return false
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isActive: true, role: true },
      })
      if (!dbUser?.isActive) return false
      const guard = await checkTeknisiLoginGuard(user.id, dbUser.role)
      return guard.allowed
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { id: true, role: true, name: true, image: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          if (dbUser.name) token.name = dbUser.name
          if (dbUser.image) token.picture = dbUser.image
        }
      }
      return authConfig.callbacks.jwt({ token, user, trigger, session })
    },
  },
  events: {
    async signIn({ user, account }) {
      const actor = user as { id?: string; role?: 'ADMIN' | 'TEKNISI' | 'USER' }
      if (actor.role === 'TEKNISI' && actor.id) {
        await setTeknisiPresence(actor.id, true)
      }
      void logAuthEvent({
        action: 'auth.login.success',
        severity: 'SUCCESS',
        summary: `${user.name ?? user.email ?? 'User'} login`,
        actor: {
          id: (user as { id?: string }).id ?? null,
          name: user.name ?? null,
          email: user.email ?? null,
          role: (user as { role?: 'ADMIN' | 'TEKNISI' | 'USER' }).role ?? null,
        },
        metadata: {
          provider: account?.provider ?? 'credentials',
        },
      })
    },
    async signOut(message) {
      const token = (message as { token?: { id?: string; name?: string; email?: string; role?: 'ADMIN' | 'TEKNISI' | 'USER' } }).token
      if (!token) return
      if (token.role === 'TEKNISI' && token.id) {
        await setTeknisiPresence(token.id, false)
      }
      void logAuthEvent({
        action: 'auth.logout',
        severity: 'INFO',
        summary: `${token.name ?? token.email ?? 'User'} logout`,
        actor: {
          id: token.id ?? null,
          name: token.name ?? null,
          email: token.email ?? null,
          role: token.role ?? null,
        },
      })
    },
  },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...authConfig.providers,
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp: { label: 'TOTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string
        const totp = (credentials.totp as string | undefined)?.trim() ?? ''

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          await evaluateLoginFailure({ email, ip: null, userAgent: null })
          return null
        }

        if (!user.isActive) {
          return null
        }

        const isValid = await compare(password, user.password)
        if (!isValid) {
          await evaluateLoginFailure({ email, ip: null, userAgent: null })
          return null
        }

        const teknisiGuard = await checkTeknisiLoginGuard(user.id, user.role)
        if (!teknisiGuard.allowed) {
          return null
        }

        if (user.twoFactorEnabled) {
          if (!user.twoFactorSecret || !totp || !(await verifyTotpCode(totp, user.twoFactorSecret))) {
            void logAuthEvent({
              action: 'auth.2fa.failed',
              severity: 'WARNING',
              summary: `2FA gagal untuk ${email}`,
              actor: { id: user.id, name: user.name, email: user.email, role: user.role },
              metadata: { email },
            })
            return null
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
})
