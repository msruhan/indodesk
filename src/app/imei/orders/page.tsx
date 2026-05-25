import { redirect } from 'next/navigation'
import { USER_IMEI_ORDERS_PATH } from '@/lib/user-imei-orders-path'

type PageProps = {
  searchParams: Promise<{ tab?: string; q?: string }>
}

/** Redirect ke riwayat order di dalam dashboard user (sidebar tetap tampil). */
export default async function ImeiOrdersRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams
  const qs = new URLSearchParams()
  if (params.tab === 'server') qs.set('tab', 'server')
  if (params.q?.trim()) qs.set('q', params.q.trim())
  const query = qs.toString()
  redirect(query ? `${USER_IMEI_ORDERS_PATH}?${query}` : USER_IMEI_ORDERS_PATH)
}
