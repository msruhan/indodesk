/** Riwayat order layanan perangkat & server di dalam dashboard user. */
export const USER_IMEI_ORDERS_PATH = '/user/orders/imei'

export function ordersImeiDetailPath(
  ordersBasePath: string,
  opts?: { tab?: 'server'; q?: string },
): string {
  const params = new URLSearchParams()
  if (opts?.tab === 'server') params.set('tab', 'server')
  if (opts?.q?.trim()) params.set('q', opts.q.trim())
  const qs = params.toString()
  return qs ? `${ordersBasePath}/imei?${qs}` : `${ordersBasePath}/imei`
}

export function userImeiOrdersHref(tab?: 'server', query?: string): string {
  return ordersImeiDetailPath('/user/orders', { tab, q: query })
}
