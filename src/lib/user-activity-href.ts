import { userImeiOrdersHref } from '@/lib/user-imei-orders-path'

export type UserActivityType =
  | 'belanja'
  | 'konsultasi'
  | 'rekber'
  | 'remote'
  | 'inspeksi'
  | 'perangkat'
  | 'server'

/** URL detail / daftar transaksi — sama dengan item di halaman riwayat. */
export function getUserActivityHref(type: UserActivityType, id?: string): string {
  switch (type) {
    case 'belanja':
      return id ? `/user/orders/${id}` : '/user/orders'
    case 'konsultasi':
      return '/user/konsultasi'
    case 'rekber':
      return '/user/rekber'
    case 'remote':
      return '/user/remote'
    case 'inspeksi':
      return id ? `/user/inspeksi/${id}` : '/user/inspeksi'
    case 'perangkat':
      return userImeiOrdersHref()
    case 'server':
      return userImeiOrdersHref('server')
  }
}
