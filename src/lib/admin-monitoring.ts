/**
 * Admin Monitoring — shared types & helpers.
 *
 * Modul ini digunakan oleh API route `/api/admin/monitoring/*` dan halaman
 * `/admin/monitoring` untuk menampilkan rekam jejak komunikasi antara user
 * dan teknisi (chat, konsultasi, remote support).
 */
import { formatNotificationTimeLabel } from '@/lib/notification-display'

export type MonitoringChannel = 'chat' | 'konsultasi' | 'remote'

export type MonitoringPartyDto = {
  id: string
  name: string
  email: string | null
  phone: string | null
  image: string | null
  role: 'USER' | 'TEKNISI' | 'ADMIN'
  isOnline?: boolean
}

export type MonitoringActivityItem = {
  id: string
  channel: MonitoringChannel
  /** Label yang ramah-pengguna untuk channel (contoh: "Chat", "Konsultasi"). */
  channelLabel: string
  /** Status (bahasa Indonesia) untuk badge. */
  statusLabel: string
  /** Variant badge UI: success | warning | danger | info | default. */
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'default'
  /** Order/Reference code yang ditampilkan, jika ada. */
  reference: string | null
  /** Ringkasan singkat (mis. last message body untuk chat, deskripsi remote). */
  summary: string
  /** Subjek/topik (mis. service name untuk konsultasi, platform untuk remote). */
  subject: string | null
  user: MonitoringPartyDto
  teknisi: MonitoringPartyDto
  /** Waktu aktivitas terbaru (ISO). */
  updatedAt: string
  /** Waktu mulai (ISO). */
  createdAt: string
  /** Label waktu relatif (mis. "5 menit lalu"). */
  timeLabel: string
  /** Metric tambahan (mis. jumlah pesan, durasi). */
  meta: Array<{ label: string; value: string }>
  /** Untuk chat: jumlah pesan unread (dari kacamata teknisi). */
  unreadCount?: number
}

export type MonitoringStats = {
  totalChat: number
  totalKonsultasi: number
  totalRemote: number
  liveSessions: number
  pendingSessions: number
  unreadMessages: number
  totalParticipants: number
  activeToday: number
}

export type MonitoringChatTranscriptMessage = {
  id: string
  body: string
  senderId: string
  senderName: string
  senderRole: 'USER' | 'TEKNISI' | 'ADMIN'
  isFromUser: boolean
  createdAt: string
  timeLabel: string
  read: boolean
}

export type MonitoringDetailDto = {
  activity: MonitoringActivityItem
  /** Untuk channel="chat" — transkrip pesan lengkap. */
  transcript?: MonitoringChatTranscriptMessage[]
  /** Untuk channel="konsultasi" — info detail konsultasi. */
  konsultasi?: {
    rating: number | null
    review: string | null
    startedAt: string | null
    endedAt: string | null
    durasi: string | null
    price: string
  }
  /** Untuk channel="remote" — info detail sesi remote. */
  remote?: {
    remoteId: string
    platform: string | null
    description: string | null
    acceptedAt: string | null
    completedAt: string | null
    durasi: string | null
  }
}

export function emptyMonitoringStats(): MonitoringStats {
  return {
    totalChat: 0,
    totalKonsultasi: 0,
    totalRemote: 0,
    liveSessions: 0,
    pendingSessions: 0,
    unreadMessages: 0,
    totalParticipants: 0,
    activeToday: 0,
  }
}

export function formatMonitoringPrice(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (num == null || Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export function formatMonitoringTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMonitoringDuration(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string | null {
  if (!start || !end) return null
  const s = typeof start === 'string' ? new Date(start) : start
  const e = typeof end === 'string' ? new Date(end) : end
  const diff = e.getTime() - s.getTime()
  if (Number.isNaN(diff) || diff < 0) return null
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '< 1 menit'
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) return `${hours} jam`
  return `${hours} jam ${remaining} menit`
}

export function formatMonitoringRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return formatNotificationTimeLabel(date)
}

export function truncateMonitoringText(text: string | null | undefined, max = 140): string {
  if (!text?.trim()) return '—'
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length <= max ? t : `${t.slice(0, max)}…`
}
