'use client'

import { useParams } from 'next/navigation'
import { TeknisiPublicProfileView } from '@/components/teknisi/teknisi-public-profile-view'

export default function TeknisiDetailPage() {
  const params = useParams()
  const teknisiId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? ''

  if (!teknisiId) {
    return (
      <p className="py-16 text-center text-sm text-surface-500">Teknisi tidak ditemukan</p>
    )
  }

  return <TeknisiPublicProfileView teknisiId={teknisiId} />
}
