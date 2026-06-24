import type { UserRole } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      mustChangePassword?: boolean
    } & DefaultSession['user']
    sessionVersion?: number
    rememberMe?: boolean
  }

  interface User {
    role: UserRole
    rememberMe?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    mustChangePassword?: boolean
    passwordChangedAt?: number
    sessionVersion?: number
    rememberMe?: boolean
    lastActivity?: number
  }
}
