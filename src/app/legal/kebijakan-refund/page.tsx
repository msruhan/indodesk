import type { Metadata } from 'next'
import { LegalPageShell, LegalPointsList } from '@/components/legal/legal-page-shell'
import { KEBIJAKAN_REFUND_POINTS, LEGAL_UPDATED_LABEL } from '@/lib/legal-content'

export const metadata: Metadata = {
  title: 'Kebijakan Refund | Bantoo',
  description: 'Kebijakan refund platform Bantoo.',
}

export default function KebijakanRefundPage() {
  return (
    <LegalPageShell title="Kebijakan Refund — Bantoo" updatedLabel={LEGAL_UPDATED_LABEL}>
      <LegalPointsList points={KEBIJAKAN_REFUND_POINTS} />
    </LegalPageShell>
  )
}
