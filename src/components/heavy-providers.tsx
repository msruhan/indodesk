'use client'

import { SidebarProvider } from '@/contexts/sidebar-context'
import { TopupProvider } from '@/contexts/topup-context'
import { WalletProvider } from '@/contexts/wallet-context'
import { ChatProvider } from '@/contexts/chat-context'
import { CartProvider } from '@/contexts/cart-context'
import { CompareProvider } from '@/contexts/compare-context'
import { AdminStepUpDialogProvider } from '@/components/admin/admin-step-up-dialog-provider'
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog'
import { ChatFloatingWidget } from '@/components/chat/chat-floating-widget'
import { CompareBar } from '@/components/marketplace/compare-bar'
import { TeknisiPresenceSync } from '@/components/teknisi/teknisi-presence-sync'
import { TeknisiRemoteRequestNotifier } from '@/components/teknisi/teknisi-remote-request-notifier'
import { SessionIdleGuard } from '@/components/auth/session-idle-guard'

/** Dashboard, marketplace, and authenticated app client state — code-split from public pages. */
export function HeavyProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionIdleGuard />
      <SidebarProvider>
        <WalletProvider>
          <TopupProvider>
            <CartProvider>
              <CompareProvider>
                <ChatProvider>
                  <ConfirmDialogProvider>
                    <AdminStepUpDialogProvider>
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
    </>
  )
}
