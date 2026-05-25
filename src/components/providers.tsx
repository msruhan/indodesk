'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { TopupProvider } from '@/contexts/topup-context'
import { WalletProvider } from '@/contexts/wallet-context'
import { ChatProvider } from '@/contexts/chat-context'
import { CartProvider } from '@/contexts/cart-context'
import { FeatureFlagsProvider } from '@/contexts/feature-flags-context'
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog'
import { ChatFloatingWidget } from '@/components/chat/chat-floating-widget'
import { TeknisiPresenceSync } from '@/components/teknisi/teknisi-presence-sync'
import { TeknisiRemoteRequestNotifier } from '@/components/teknisi/teknisi-remote-request-notifier'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={5 * 60}
    >
      <AuthProvider>
        <FeatureFlagsProvider>
          <SidebarProvider>
            <WalletProvider>
              <TopupProvider>
                <CartProvider>
                  <ChatProvider>
                    <ConfirmDialogProvider>
                      <Toaster position="top-right" richColors />
                      <TeknisiPresenceSync />
                      <TeknisiRemoteRequestNotifier />
                      {children}
                      <ChatFloatingWidget />
                    </ConfirmDialogProvider>
                  </ChatProvider>
                </CartProvider>
              </TopupProvider>
            </WalletProvider>
          </SidebarProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
