/**
 * Notifikasi monitoring untuk admin — di-merge ke notification center.
 * Sumber: chat, konsultasi, dan remote dari database (bukan mock).
 */
import { prisma } from '@/lib/db'
import type { PlatformNotification } from '@/data/mock-platform-notifications'
import { truncateMonitoringText } from '@/lib/admin-monitoring'

const RECENT_ACTIVITY_MS = 2 * 60 * 60 * 1000
const MAX_PER_CHANNEL = 8
const MAX_TOTAL = 24

function monitoringId(channel: string, id: string) {
  return `monitoring:${channel}:${id}`
}

function toneFromStatus(
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'default',
): PlatformNotification['tone'] {
  switch (statusTone) {
    case 'warning':
      return 'warning'
    case 'danger':
      return 'warning'
    case 'success':
      return 'success'
    case 'info':
      return 'primary'
    default:
      return 'neutral'
  }
}

function iconFromChannel(channel: 'chat' | 'konsultasi' | 'remote'): PlatformNotification['icon'] {
  switch (channel) {
    case 'chat':
      return 'message'
    case 'konsultasi':
      return 'bell'
    case 'remote':
      return 'shield'
  }
}

function konsultasiStatusLabel(status: string): { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'default' } {
  switch (status) {
    case 'PENDING':
      return { label: 'Menunggu', tone: 'warning' }
    case 'ACTIVE':
      return { label: 'Berjalan', tone: 'info' }
    case 'AWAITING_CONFIRMATION':
      return { label: 'Menunggu konfirmasi', tone: 'warning' }
    case 'COMPLETED':
      return { label: 'Selesai', tone: 'success' }
    case 'CANCELLED':
      return { label: 'Dibatalkan', tone: 'danger' }
    default:
      return { label: status, tone: 'default' }
  }
}

function remoteStatusLabel(status: string): { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'default' } {
  switch (status) {
    case 'WAITING':
      return { label: 'Menunggu', tone: 'warning' }
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return { label: 'Berlangsung', tone: 'info' }
    case 'REJECTED':
      return { label: 'Ditolak', tone: 'danger' }
    case 'COMPLETED':
      return { label: 'Selesai', tone: 'success' }
    default:
      return { label: status, tone: 'default' }
  }
}

function shouldNotifyKonsultasi(status: string, updatedAt: Date, createdAt: Date, since: Date): boolean {
  if (status === 'PENDING' || status === 'ACTIVE' || status === 'AWAITING_CONFIRMATION') return true
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return updatedAt >= since || createdAt >= since
  }
  return updatedAt >= since
}

function shouldNotifyRemote(status: string, updatedAt: Date, createdAt: Date, since: Date): boolean {
  if (status === 'WAITING' || status === 'IN_PROGRESS' || status === 'ACCEPTED') return true
  if (status === 'COMPLETED' || status === 'REJECTED') {
    return updatedAt >= since || createdAt >= since
  }
  return updatedAt >= since
}

/** Ambil alert monitoring terbaru untuk notification center admin. */
export async function fetchAdminMonitoringNotifications(): Promise<PlatformNotification[]> {
  const since = new Date(Date.now() - RECENT_ACTIVITY_MS)
  const notifications: PlatformNotification[] = []

  const [konsultasiRows, remoteRows, chatRows] = await Promise.all([
    prisma.konsultasiSession.findMany({
      include: {
        user: { select: { name: true } },
        teknisi: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    }),
    prisma.remoteSession.findMany({
      include: {
        user: { select: { name: true } },
        teknisi: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    }),
    prisma.chatConversation.findMany({
      include: {
        user: { select: { name: true } },
        teknisi: { select: { name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: 40,
    }),
  ])

  let konsultasiCount = 0
  for (const s of konsultasiRows) {
    if (!shouldNotifyKonsultasi(s.status, s.updatedAt, s.createdAt, since)) continue
    const badge = konsultasiStatusLabel(s.status)
    const userName = s.user.name ?? 'User'
    const teknisiName = s.teknisi.name ?? 'Teknisi'
    notifications.push({
      id: monitoringId('konsultasi', s.id),
      title: `Konsultasi · ${badge.label}`,
      body: truncateMonitoringText(
        `${userName} ↔ ${teknisiName} — ${s.service}`,
        120,
      ),
      audiences: ['ADMIN'],
      tone: toneFromStatus(badge.tone),
      icon: iconFromChannel('konsultasi'),
      active: true,
      createdAt: s.updatedAt.toISOString(),
      href: `/admin/monitoring?tab=konsultasi`,
      kind: 'monitoring',
    })
    konsultasiCount++
    if (konsultasiCount >= MAX_PER_CHANNEL) break
  }

  let remoteCount = 0
  for (const s of remoteRows) {
    if (!shouldNotifyRemote(s.status, s.updatedAt, s.createdAt, since)) continue
    const badge = remoteStatusLabel(s.status)
    const userName = s.user.name ?? 'User'
    const teknisiName = s.teknisi.name ?? 'Teknisi'
    notifications.push({
      id: monitoringId('remote', s.id),
      title: `Remote · ${badge.label}`,
      body: truncateMonitoringText(
        `${userName} ↔ ${teknisiName} — ${s.description ?? s.remoteId}`,
        120,
      ),
      audiences: ['ADMIN'],
      tone: toneFromStatus(badge.tone),
      icon: iconFromChannel('remote'),
      active: true,
      createdAt: s.updatedAt.toISOString(),
      href: `/admin/monitoring?tab=remote`,
      kind: 'monitoring',
    })
    remoteCount++
    if (remoteCount >= MAX_PER_CHANNEL) break
  }

  const chatIds = chatRows.map((c) => c.id)
  const unreadByConversation =
    chatIds.length > 0
      ? await prisma.chatMessage.groupBy({
          by: ['conversationId'],
          where: { conversationId: { in: chatIds }, readAt: null },
          _count: { _all: true },
        })
      : []
  const unreadMap = new Map(
    unreadByConversation.map((row) => [row.conversationId, row._count._all]),
  )

  let chatCount = 0
  for (const c of chatRows) {
    const last = c.messages[0]
    const lastAt = c.lastMessageAt ?? last?.createdAt ?? c.updatedAt
    const unread = unreadMap.get(c.id) ?? 0
    const isRecent = lastAt >= since
    if (unread === 0 && !isRecent) continue

    const userName = c.user.name ?? 'User'
    const teknisiName = c.teknisi.name ?? 'Teknisi'
    const statusLabel = unread > 0 ? `${unread} belum dibaca` : 'Pesan baru'
    notifications.push({
      id: monitoringId('chat', c.id),
      title: `Chat · ${statusLabel}`,
      body: truncateMonitoringText(
        `${userName} ↔ ${teknisiName} — ${last?.body ?? 'Percakapan aktif'}`,
        120,
      ),
      audiences: ['ADMIN'],
      tone: unread > 0 ? 'warning' : 'primary',
      icon: iconFromChannel('chat'),
      active: true,
      createdAt: lastAt.toISOString(),
      href: `/admin/monitoring?tab=chat`,
      kind: 'monitoring',
    })
    chatCount++
    if (chatCount >= MAX_PER_CHANNEL) break
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return notifications.slice(0, MAX_TOTAL)
}
