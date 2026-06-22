import type { Metadata } from 'next'
import { ComingSoonView } from '@/components/coming-soon/coming-soon-view'
import { SUPPORT_EMAIL } from '@/lib/legal-content'
import { getPublicComingSoonConfig } from '@/lib/platform-settings'

export const metadata: Metadata = {
  title: 'Segera Hadir — Bantoo',
  description: 'Platform ekosistem HP Indonesia sedang dalam persiapan peluncuran.',
  robots: { index: false, follow: false },
}

/** Revalidate coming soon copy & countdown target (~1 min). */
export const revalidate = 60

export default async function ComingSoonPage() {
  const config = await getPublicComingSoonConfig()

  return (
    <ComingSoonView
      initialConfig={config}
      supportEmail={SUPPORT_EMAIL}
    />
  )
}
