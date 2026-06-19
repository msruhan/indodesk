import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { authConfig } from '@/auth.config'
import { logAuthEvent } from '@/lib/activity-log'
import { verifySecondFactor } from '@/lib/auth/verify-2fa'
import { onLoginSuccess } from '@/lib/auth/suspicious-login'
import { AccountLockedError, checkLockout, clearLockout, recordLoginFailure, recordSecondFactorFailure } from '@/lib/lockout'
import { checkTeknisiLoginGuard } from '@/lib/teknisi-login-guard'
import { setTeknisiPresence } from '@/lib/teknisi-presence'
import { getCachedSessionVersion, setCachedSessionVersion } from '@/lib/session-version-cache'
import { bumpSessionVersion } from '@/lib/session-version'
import { isLoginEmailVerified } from '@/lib/auth/login-email-guard'
import { getRequestContext } from '@/lib/request-context'
import {
  isComingSoonEnabled,
} from '@/lib/coming-soon-server'

import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'
import { evaluateGoogleSignIn } from '@/lib/auth/google-oauth-policy'
import { clearGoogleLinkIntentCookie } from '@/lib/auth/google-link-cookie'

const googleClientId = process.env.AUTH_GOOGLE_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET
const googleEnabled = isGoogleAuthEnabled

export { isGoogleAuthEnabled }

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as never,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const decision = await evaluateGoogleSignIn({
          userId: user.id,
          email: user.email,
          providerAccountId: account.providerAccountId,
        })
        if (!decision.ok) {
          return `/login?error=${encodeURIComponent(decision.error)}`
        }
        return true
      }

      if (!user.id) return false
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isActive: true, role: true, twoFactorEnabled: true, email: true, emailVerified: true },
      })
      if (!dbUser?.isActive) return false
      if (!isLoginEmailVerified(dbUser)) return false

      if ((await isComingSoonEnabled()) && dbUser.role !== 'ADMIN') {
        return `/login?error=${encodeURIComponent('coming_soon_admin_only')}`
      }

      const guard = await checkTeknisiLoginGuard(user.id, dbUser.role)
      return guard.allowed
    },
    async jwt({ token, user, trigger, session }) {
      const userId = (user?.id ?? token.id) as string | undefined

      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
            name: true,
            image: true,
            isActive: true,
            passwordChangedAt: true,
            mustChangePassword: true,
            sessionVersion: true,
          },
        })

        if (!dbUser?.isActive) {
          return null as unknown as typeof token
        }

        if (
          typeof token.sessionVersion === 'number' &&
          token.sessionVersion !== dbUser.sessionVersion
        ) {
          return null as unknown as typeof token
        }

        if (
          dbUser.passwordChangedAt &&
          token.iat &&
          token.iat < Math.floor(dbUser.passwordChangedAt.getTime() / 1000)
        ) {
          return null as unknown as typeof token
        }

        token.id = dbUser.id
        token.role = dbUser.role
        token.isActive = dbUser.isActive
        token.sessionVersion = dbUser.sessionVersion
        token.mustChangePassword = dbUser.mustChangePassword
        if (dbUser.passwordChangedAt) {
          token.passwordChangedAt = Math.floor(dbUser.passwordChangedAt.getTime() / 1000)
        }
        if (dbUser.name) token.name = dbUser.name
        if (dbUser.image) token.picture = dbUser.image

        const cached = await getCachedSessionVersion(userId)
        if (cached === null || cached !== dbUser.sessionVersion) {
          await setCachedSessionVersion(userId, dbUser.sessionVersion)
        }
      }

      return authConfig.callbacks.jwt({ token, user, trigger, session })
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return
      await prisma.wallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id, balance: 0 },
        update: {},
      })
    },
    async signIn({ user, account }) {
      const actor = user as { id?: string; role?: 'ADMIN' | 'TEKNISI' | 'USER' }
      if (account?.provider === 'google') {
        await clearGoogleLinkIntentCookie()
      }
      if (actor.role === 'TEKNISI' && actor.id) {
        await setTeknisiPresence(actor.id, true)
      }
      if (actor.id && user.email) {
        const reqCtx = getRequestContext()
        void onLoginSuccess({
          userId: actor.id,
          email: user.email,
          name: user.name ?? null,
          ip: reqCtx?.ip ?? null,
          userAgent: reqCtx?.userAgent ?? null,
        })
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
    async linkAccount({ user, account }) {
      await clearGoogleLinkIntentCookie()
      if (account.provider === 'google' && user.id) {
        void logAuthEvent({
          action: 'auth.oauth.linked',
          severity: 'SUCCESS',
          summary: `Google dihubungkan ke akun ${user.email ?? user.id}`,
          actor: {
            id: user.id,
            name: user.name ?? null,
            email: user.email ?? null,
            role: (user as { role?: 'ADMIN' | 'TEKNISI' | 'USER' }).role ?? null,
          },
          metadata: { provider: 'google' },
        })
      }
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
            allowDangerousEmailAccountLinking: false,
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

        try {
          try {
            await checkLockout(email)
          } catch (e) {
            if (e instanceof AccountLockedError) return null
            throw e
          }

          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.password) {
            await recordLoginFailure({ email, ip: null, userAgent: null })
            return null
          }

          const isValid = await compare(password, user.password)
          if (!isValid) {
            await recordLoginFailure({ email, ip: null, userAgent: null })
            return null
          }

          if (!isLoginEmailVerified(user)) {
            return null
          }

          const teknisiGuard = await checkTeknisiLoginGuard(user.id, user.role)
          if (!teknisiGuard.allowed) {
            return null
          }

          if (!user.isActive) {
            return null
          }

          if ((await isComingSoonEnabled()) && user.role !== 'ADMIN') {
            return null
          }

          if (user.twoFactorEnabled) {
            const ok2fa = await verifySecondFactor({
              userId: user.id,
              input: totp,
              totpSecret: user.twoFactorSecret,
            })
            if (!ok2fa) {
              const lockedUntil = await recordSecondFactorFailure({ email })
              void logAuthEvent({
                action: 'auth.2fa.failed',
                severity: 'WARNING',
                summary: `2FA gagal untuk ${email}`,
                actor: { id: user.id, name: user.name, email: user.email, role: user.role },
                metadata: { email, lockedUntil: lockedUntil?.toISOString() ?? null },
              })
              return null
            }
          }

          await clearLockout(email)

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            sessionVersion: user.sessionVersion,
          }
        } catch (e) {
          console.error('[AUTH_CREDENTIALS_AUTHORIZE]', e)
          return null
        }
      },
    }),
  ],
})
