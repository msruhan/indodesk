'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'admin' | 'teknisi' | 'user'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role?: UserRole) => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (mock - in production, check from server/cookie)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role?: UserRole) => {
    // Mock login - in production, call API
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockUser: User = {
      id: '1',
      name: role === 'admin' ? 'Admin User' : role === 'teknisi' ? 'Teknisi Handphone' : 'User Customer',
      email,
      role: role || 'user',
    }
    
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
    setIsLoading(false)
  }

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    // Mock register - in production, call API
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
    }
    
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

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

