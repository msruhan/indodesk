'use client'

import { useParams } from 'next/navigation'
import { TokoProdukView } from '@/components/toko/toko-produk-view'

export default function TokoProdukPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''

  if (!id) return null

  return <TokoProdukView storeId={id} />
}
