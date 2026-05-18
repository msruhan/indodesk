import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { verifyTotpCode } from '@/lib/totp'
import { authConfig } from '@/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as never,
  providers: [
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

        if (!user || !user.password) return null

        const isValid = await compare(password, user.password)
        if (!isValid) return null

        if (user.twoFactorEnabled) {
          if (!user.twoFactorSecret || !totp || !(await verifyTotpCode(totp, user.twoFactorSecret))) {
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
