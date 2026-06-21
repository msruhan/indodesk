'use client'

import { SessionProvider } from 'next-auth/react'
import { CspNonceProvider } from '@/components/csp-nonce-provider'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { TopupProvider } from '@/contexts/topup-context'
import { WalletProvider } from '@/contexts/wallet-context'
import { ChatProvider } from '@/contexts/chat-context'
import { CartProvider } from '@/contexts/cart-context'
import { CompareProvider } from '@/contexts/compare-context'
import { FeatureFlagsProvider } from '@/contexts/feature-flags-context'
import { AdminStepUpDialogProvider } from '@/components/admin/admin-step-up-dialog-provider'
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog'
import { ChatFloatingWidget } from '@/components/chat/chat-floating-widget'
import { CompareBar } from '@/components/marketplace/compare-bar'
import { TeknisiPresenceSync } from '@/components/teknisi/teknisi-presence-sync'
import { TeknisiRemoteRequestNotifier } from '@/components/teknisi/teknisi-remote-request-notifier'
import { SessionIdleGuard } from '@/components/auth/session-idle-guard'

export function Providers({
  children,
  cspNonce,
}: {
  children: React.ReactNode
  cspNonce?: string
}) {
  return (
    <CspNonceProvider nonce={cspNonce}>
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60}>
      <AuthProvider>
        <SessionIdleGuard />
        <FeatureFlagsProvider>
          <SidebarProvider>
            <WalletProvider>
              <TopupProvider>
                <CartProvider>
                  <CompareProvider>
                  <ChatProvider>
                    <ConfirmDialogProvider>
                      <AdminStepUpDialogProvider>
                        <Toaster position="top-right" richColors />
                        <TeknisiPresenceSync />
                        <TeknisiRemoteRequestNotifier />
                        {children}
                        <ChatFloatingWidget />
                        <CompareBar />
                      </AdminStepUpDialogProvider>
                    </ConfirmDialogProvider>
                  </ChatProvider>
                  </CompareProvider>
                </CartProvider>
              </TopupProvider>
            </WalletProvider>
          </SidebarProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </SessionProvider>
    </CspNonceProvider>
  )
}
