export type NotificationAudience = 'USER' | 'TEKNISI' | 'ADMIN'

export type NotificationIconKey = 'shield' | 'message' | 'check' | 'bell' | 'package'

export type NotificationTone = 'primary' | 'warning' | 'success' | 'neutral'

export type PlatformNotification = {
  id: string
  title: string
  body: string
  audiences: NotificationAudience[]
  tone: NotificationTone
  icon: NotificationIconKey
  active: boolean
  createdAt: string
  /** Link saat notifikasi dari order (opsional). */
  href?: string | null
  kind?: 'broadcast' | 'order'
}

const now = Date.now()

export const defaultPlatformNotifications: PlatformNotification[] = [
  {
    id: 'n1',
    title: 'Pesanan marketplace dikirim',
    body: 'Pesanan ORD-2024-089 sedang dalam perjalanan ke alamat Anda.',
    audiences: ['USER'],
    tone: 'primary',
    icon: 'package',
    active: true,
    createdAt: new Date(now - 5 * 60_000).toISOString(),
  },
  {
    id: 'n2',
    title: 'Konsultasi baru masuk',
    body: 'Customer meminta bantuan unlock iPhone 13 — balas segera.',
    audiences: ['TEKNISI'],
    tone: 'primary',
    icon: 'message',
    active: true,
    createdAt: new Date(now - 8 * 60_000).toISOString(),
  },
  {
    id: 'n3',
    title: 'Rekber perlu validasi',
    body: 'Transaksi escrow ORD-2024-004 menunggu tindakan admin.',
    audiences: ['ADMIN'],
    tone: 'warning',
    icon: 'shield',
    active: true,
    createdAt: new Date(now - 2 * 60_000).toISOString(),
  },
  {
    id: 'n4',
    title: 'Approval teknisi selesai',
    body: 'Profil teknisi Ahmad Hidayat telah diverifikasi.',
    audiences: ['ADMIN', 'TEKNISI'],
    tone: 'success',
    icon: 'check',
    active: true,
    createdAt: new Date(now - 15 * 60_000).toISOString(),
  },
  {
    id: 'n5',
    title: 'Promo top-up digital',
    body: 'Cashback 10% untuk pembelian diamond & voucher hari ini.',
    audiences: ['USER', 'TEKNISI'],
    tone: 'neutral',
    icon: 'bell',
    active: true,
    createdAt: new Date(now - 60 * 60_000).toISOString(),
  },
]
