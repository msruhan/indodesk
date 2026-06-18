import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { USER_IMEI_ORDERS_PATH } from '@/lib/user-imei-orders-path'

type PageProps = {
  searchParams: Promise<{ tab?: string; q?: string }>
}

/** Redirect ke riwayat order di dalam dashboard user (sidebar tetap tampil). */
export default async function ImeiOrdersRedirectPage({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role
  const params = await searchParams
  const qs = new URLSearchParams()
  const isServerTab = params.tab === 'server'
  if (isServerTab) qs.set('tab', 'server')
  if (role === 'TEKNISI' && !isServerTab) qs.set('tab', 'imei')
  if (params.q?.trim()) qs.set('q', params.q.trim())
  const query = qs.toString()
  if (role === 'TEKNISI') {
    redirect(query ? `/teknisi/orders?${query}` : '/teknisi/orders?tab=imei')
  }
  redirect(query ? `${USER_IMEI_ORDERS_PATH}?${query}` : USER_IMEI_ORDERS_PATH)
}
