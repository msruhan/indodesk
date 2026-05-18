'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { TopupProvider } from '@/contexts/topup-context'
import { WalletProvider } from '@/contexts/wallet-context'
import { ChatProvider } from '@/contexts/chat-context'
import { CartProvider } from '@/contexts/cart-context'
import { ChatFloatingWidget } from '@/components/chat/chat-floating-widget'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={5 * 60}
    >
      <AuthProvider>
        <SidebarProvider>
          <WalletProvider>
            <TopupProvider>
              <CartProvider>
                <ChatProvider>
                  {children}
                  <ChatFloatingWidget />
                </ChatProvider>
              </CartProvider>
            </TopupProvider>
          </WalletProvider>
        </SidebarProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
