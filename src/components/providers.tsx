'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { TopupProvider } from '@/contexts/topup-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={5 * 60}
    >
      <AuthProvider>
        <SidebarProvider>
          <TopupProvider>
            {children}
          </TopupProvider>
        </SidebarProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
