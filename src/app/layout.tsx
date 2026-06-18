import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { CSP_NONCE_HEADER } from '@/lib/security/headers'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bandoo - Platform Ekosistem Teknisi Handphone',
  description: 'Platform terpadu untuk teknisi handphone, marketplace, konsultasi online, dan manajemen bisnis service handphone.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined

  return (
    <html lang="id" className={outfit.variable}>
      <body className={outfit.className}>
        <Providers cspNonce={nonce}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
