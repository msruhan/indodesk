import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { ChatProvider } from '@/contexts/chat-context'
import { ChatPopup } from '@/components/chat/chat-popup'
import { ChatButton } from '@/components/chat/chat-button'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IndoTeknizi - Platform Ekosistem Teknisi Handphone',
  description: 'Platform terpadu untuk teknisi handphone, marketplace, konsultasi online, dan manajemen bisnis service handphone.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={outfit.variable}>
      <body className={outfit.className}>
        <AuthProvider>
          <SidebarProvider>
            <ChatProvider>
              {children}
              <ChatPopup />
              <ChatButton />
            </ChatProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

