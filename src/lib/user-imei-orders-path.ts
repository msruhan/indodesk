/** Riwayat order layanan perangkat & server di dalam dashboard user. */
export const USER_IMEI_ORDERS_PATH = '/user/orders/imei'

export function userImeiOrdersHref(tab?: 'server', query?: string): string {
  const params = new URLSearchParams()
  if (tab === 'server') params.set('tab', 'server')
  if (query?.trim()) params.set('q', query.trim())
  const qs = params.toString()
  return qs ? `${USER_IMEI_ORDERS_PATH}?${qs}` : USER_IMEI_ORDERS_PATH
}
