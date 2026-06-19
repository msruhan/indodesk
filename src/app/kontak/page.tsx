import type { Metadata } from 'next'
import { KontakSupportCard, LegalPageShell } from '@/components/legal/legal-page-shell'

export const metadata: Metadata = {
  title: 'Kontak Support | Bantoo',
  description: 'Hubungi tim support Bantoo.',
}

export default function KontakPage() {
  return (
    <LegalPageShell title="Hubungi Kami">
      <KontakSupportCard />
    </LegalPageShell>
  )
}
