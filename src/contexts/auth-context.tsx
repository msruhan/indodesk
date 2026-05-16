'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string, role: 'USER' | 'TEKNISI') => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
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

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          return { success: false, error: 'Email atau password salah' }
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
      role: 'USER' | 'TEKNISI',
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        })

        const data = await res.json()

        if (!res.ok) {
          return { success: false, error: data.error || 'Registrasi gagal' }
        }

        // Auto-login after register
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

  const logout = useCallback(async () => {
    await signOut({ redirect: false })
    router.push('/')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
