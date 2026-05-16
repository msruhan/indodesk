import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
