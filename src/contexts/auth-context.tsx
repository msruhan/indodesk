'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signOut, useSession, getSession } from 'next-auth/react'

export type UserRole = 'ADMIN' | 'TEKNISI' | 'USER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  image?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (
    email: string,
    password: string,
    totp?: string,
  ) => Promise<{ success: boolean; error?: string; requires2FA?: boolean }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  registerTeknisi: (payload: Record<string, unknown>) => Promise<{ success: boolean; error?: string; message?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoading = status === 'loading'

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: session.user.role as UserRole,
        image: session.user.image,
      }
    : null

  const refreshSession = useCallback(async () => {
    await getSession()
  }, [])

  const login = useCallback(
    async (
      email: string,
      password: string,
      totp?: string,
    ): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> => {
      try {
        if (!totp) {
          const checkRes = await fetch('/api/auth/check-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const checkData = await checkRes.json()
          if (!checkData.success) {
            return { success: false, error: checkData.error || 'Email atau password salah' }
          }
          if (checkData.data?.requires2FA) {
            return { success: false, requires2FA: true }
          }
        }

        const result = await signIn('credentials', {
          email,
          password,
          totp: totp ?? '',
          redirect: false,
        })

        if (result?.error) {
          return {
            success: false,
            error: totp ? 'Kode Google Authenticator tidak valid' : 'Email atau password salah',
          }
        }

        return { success: true }
      } catch {
        return { success: false, error: 'Terjadi kesalahan' }
      }
    },
    [],
  )

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: 'USER' }),
        })

        const data = await res.json()

        if (!res.ok) {
          return { success: false, error: data.error || 'Registrasi gagal' }
        }

        const loginResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (loginResult?.error) {
          return { success: false, error: 'Registrasi berhasil tapi gagal login otomatis' }
        }

        return { success: true }
      } catch {
        return { success: false, error: 'Terjadi kesalahan' }
      }
    },
    [],
  )

  const registerTeknisi = useCallback(
    async (
      payload: Record<string, unknown>,
    ): Promise<{ success: boolean; error?: string; message?: string }> => {
      try {
        const res = await fetch('/api/auth/register/teknisi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          return { success: false, error: data.error || 'Registrasi gagal' }
        }

        return {
          success: true,
          message: data.data?.message as string | undefined,
        }
      } catch {
        return { success: false, error: 'Terjadi kesalahan' }
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    if (user?.role === 'TEKNISI') {
      try {
        await fetch('/api/teknisi/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ online: false }),
          keepalive: true,
        })
      } catch {
        /* ignore */
      }
    }
    await signOut({ redirect: false })
    router.push('/')
  }, [router, user?.role])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, registerTeknisi, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
