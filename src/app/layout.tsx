import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { CSP_NONCE_HEADER } from '@/lib/security/headers'
import { PUBLIC_SHELL_HEADER } from '@/lib/public-shell-paths'
import { getPublicComingSoonConfig } from '@/lib/platform-settings'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bantoo - Platform Ekosistem Digital',
  description:
    'Platform terpadu marketplace, transaksi aman, layanan teknisi, konsultasi online, dan layanan digital untuk ekosistem teknologi Indonesia.',
  icons: {
    icon: '/icon/iconbantoo.png',
    apple: '/icon/iconbantoo.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = await headers()
  const nonce = requestHeaders.get(CSP_NONCE_HEADER) ?? undefined
  const publicShell = requestHeaders.get(PUBLIC_SHELL_HEADER) === '1'
  const comingSoon = await getPublicComingSoonConfig()

  return (
    <html lang="id" className={outfit.variable}>
      <body className={outfit.className}>
        <Providers
          cspNonce={nonce}
          publicShell={publicShell}
          comingSoonEnabled={comingSoon.enabled}
        >
          {children}
        </Providers>
      </body>
    </html>
  )
}
