'use client'

import { useParams } from 'next/navigation'
import { TokoDetailView } from '@/components/toko/toko-detail-view'

export default function TokoDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''

  if (!id) {
    return null
  }

  return <TokoDetailView storeId={id} />
}
