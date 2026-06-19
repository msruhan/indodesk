import type { Metadata } from 'next'
import { LegalPageShell, LegalPointsList } from '@/components/legal/legal-page-shell'
import { KEBIJAKAN_PRIVASI_POINTS, LEGAL_UPDATED_LABEL } from '@/lib/legal-content'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Bantoo',
  description: 'Kebijakan privasi platform Bantoo.',
}

export default function KebijakanPrivasiPage() {
  return (
    <LegalPageShell title="Kebijakan Privasi — Bantoo" updatedLabel={LEGAL_UPDATED_LABEL}>
      <LegalPointsList points={KEBIJAKAN_PRIVASI_POINTS} />
    </LegalPageShell>
  )
}
