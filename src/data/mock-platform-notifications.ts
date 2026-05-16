import type { UserRole } from '@/contexts/auth-context'

export type NotificationAudience = 'USER' | 'TEKNISI' | 'ADMIN'

export type NotificationIconKey = 'shield' | 'message' | 'check' | 'bell' | 'package'

export type NotificationTone = 'primary' | 'warning' | 'success' | 'neutral'

export type PlatformNotification = {
  id: string
  title: string
  body: string
  timeLabel: string
  audiences: NotificationAudience[]
  tone: NotificationTone
  icon: NotificationIconKey
  active: boolean
}

export const defaultPlatformNotifications: PlatformNotification[] = [
  {
    id: 'n1',
    title: 'Pesanan marketplace dikirim',
    body: 'Pesanan ORD-2024-089 sedang dalam perjalanan ke alamat Anda.',
    timeLabel: '5 menit lalu',
    audiences: ['USER'],
    tone: 'primary',
    icon: 'package',
    active: true,
  },
  {
    id: 'n2',
    title: 'Konsultasi baru masuk',
    body: 'Customer meminta bantuan unlock iPhone 13 — balas segera.',
    timeLabel: '8 menit lalu',
    audiences: ['TEKNISI'],
    tone: 'primary',
    icon: 'message',
    active: true,
  },
  {
    id: 'n3',
    title: 'Rekber perlu validasi',
    body: 'Transaksi escrow ORD-2024-004 menunggu tindakan admin.',
    timeLabel: '2 menit lalu',
    audiences: ['ADMIN'],
    tone: 'warning',
    icon: 'shield',
    active: true,
  },
  {
    id: 'n4',
    title: 'Approval teknisi selesai',
    body: 'Profil teknisi Ahmad Hidayat telah diverifikasi.',
    timeLabel: '15 menit lalu',
    audiences: ['ADMIN', 'TEKNISI'],
    tone: 'success',
    icon: 'check',
    active: true,
  },
  {
    id: 'n5',
    title: 'Promo top-up digital',
    body: 'Cashback 10% untuk pembelian diamond & voucher hari ini.',
    timeLabel: '1 jam lalu',
    audiences: ['USER', 'TEKNISI'],
    tone: 'neutral',
    icon: 'bell',
    active: true,
  },
]

export function notificationMatchesRole(
  notification: PlatformNotification,
  role: UserRole | undefined,
): boolean {
  if (!notification.active) return false
  if (!role) return notification.audiences.includes('USER')
  return notification.audiences.includes(role)
}
