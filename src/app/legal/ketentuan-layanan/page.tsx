import type { Metadata } from 'next'
import { LegalPageShell, LegalPointsList } from '@/components/legal/legal-page-shell'
import { KETENTUAN_LAYANAN_POINTS, LEGAL_UPDATED_LABEL } from '@/lib/legal-content'

export const metadata: Metadata = {
  title: 'Ketentuan Layanan | Bantoo',
  description: 'Ketentuan penggunaan platform Bantoo.',
}

export default function KetentuanLayananPage() {
  return (
    <LegalPageShell title="Ketentuan Layanan — Bantoo" updatedLabel={LEGAL_UPDATED_LABEL}>
      <LegalPointsList points={KETENTUAN_LAYANAN_POINTS} />
    </LegalPageShell>
  )
}
