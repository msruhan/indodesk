import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  formatMonitoringDuration,
  formatMonitoringPrice,
  formatMonitoringRelativeTime,
  truncateMonitoringText,
  type MonitoringActivityItem,
  type MonitoringPartyDto,
  type MonitoringStats,
} from '@/lib/admin-monitoring'

export const dynamic = 'force-dynamic'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  teknisiProfile: { select: { isOnline: true } },
} as const

type PartyRecord = {
  id: string
  name: string
  email: string | null
  phone: string | null
  image: string | null
  role: 'USER' | 'TEKNISI' | 'ADMIN'
  teknisiProfile: { isOnline: boolean } | null
}

function partyDto(record: PartyRecord): MonitoringPartyDto {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    image: record.image,
    role: record.role,
    isOnline: record.teknisiProfile?.isOnline ?? undefined,
  }
}

function konsultasiBadge(status: string): { label: string; tone: MonitoringActivityItem['statusTone'] } {
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

function remoteBadge(status: string): { label: string; tone: MonitoringActivityItem['statusTone'] } {
  switch (status) {
    case 'WAITING':
      return { label: 'Menunggu', tone: 'warning' }
    case 'ACCEPTED':
      return { label: 'Diterima', tone: 'info' }
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

function buildSearchFilter(q: string | null) {
  if (!q?.trim()) return null
  const search = q.trim()
  return {
    OR: [
      { user: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
      { user: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
      { teknisi: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
      { teknisi: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
    ],
  }
}

async function loadChatItems(q: string | null): Promise<MonitoringActivityItem[]> {
  const where = buildSearchFilter(q) ?? {}

  const conversations = await prisma.chatConversation.findMany({
    where,
    include: {
      user: { select: PARTY_SELECT },
      teknisi: { select: PARTY_SELECT },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: 100,
  })

  const items: MonitoringActivityItem[] = []
  for (const c of conversations) {
    const last = c.messages[0]
    const unread = await prisma.chatMessage.count({
      where: { conversationId: c.id, readAt: null },
    })
    const updatedAt = (last?.createdAt ?? c.lastMessageAt ?? c.updatedAt).toISOString()
    items.push({
      id: c.id,
      channel: 'chat',
      channelLabel: 'Chat',
      statusLabel: unread > 0 ? `${unread} belum dibaca` : 'Aktif',
      statusTone: unread > 0 ? 'warning' : 'success',
      reference: null,
      summary: truncateMonitoringText(last?.body ?? 'Belum ada pesan dalam percakapan ini.'),
      subject: c._count.messages > 0 ? `${c._count.messages} pesan` : 'Percakapan baru',
      user: partyDto(c.user as PartyRecord),
      teknisi: partyDto(c.teknisi as PartyRecord),
      updatedAt,
      createdAt: c.createdAt.toISOString(),
      timeLabel: formatMonitoringRelativeTime(updatedAt),
      meta: [
        { label: 'Total pesan', value: String(c._count.messages) },
        { label: 'Belum dibaca', value: String(unread) },
      ],
      unreadCount: unread,
    })
  }
  return items
}

async function loadKonsultasiItems(q: string | null): Promise<MonitoringActivityItem[]> {
  const where = buildSearchFilter(q) ?? {}
  const sessions = await prisma.konsultasiSession.findMany({
    where,
    include: {
      user: { select: PARTY_SELECT },
      teknisi: { select: PARTY_SELECT },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return sessions.map((s) => {
    const badge = konsultasiBadge(s.status)
    const durasi = formatMonitoringDuration(s.startedAt, s.endedAt)
    const meta: Array<{ label: string; value: string }> = [
      { label: 'Biaya', value: formatMonitoringPrice(s.price.toString()) },
    ]
    if (durasi) meta.push({ label: 'Durasi', value: durasi })
    if (s.rating) meta.push({ label: 'Rating', value: `${s.rating} / 5` })
    if (s.confirmDeadlineAt) {
      meta.push({
        label: 'Batas konfirmasi',
        value: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(s.confirmDeadlineAt),
      })
    }

    return {
      id: s.id,
      channel: 'konsultasi' as const,
      channelLabel: 'Konsultasi',
      statusLabel: badge.label,
      statusTone: badge.tone,
      reference: s.id.slice(0, 8).toUpperCase(),
      summary: truncateMonitoringText(s.review ?? `Sesi konsultasi ${s.service.toLowerCase()}.`),
      subject: s.service,
      user: partyDto(s.user as PartyRecord),
      teknisi: partyDto(s.teknisi as PartyRecord),
      updatedAt: s.updatedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      timeLabel: formatMonitoringRelativeTime(s.updatedAt),
      meta,
    }
  })
}

async function loadRemoteItems(q: string | null): Promise<MonitoringActivityItem[]> {
  const where = buildSearchFilter(q) ?? {}
  const sessions = await prisma.remoteSession.findMany({
    where,
    include: {
      user: { select: PARTY_SELECT },
      teknisi: { select: PARTY_SELECT },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return sessions.map((s) => {
    const badge = remoteBadge(s.status)
    const durasi = formatMonitoringDuration(s.acceptedAt ?? s.createdAt, s.completedAt)
    const meta: Array<{ label: string; value: string }> = [
      { label: 'Remote ID', value: s.remoteId },
    ]
    if (s.platform) meta.push({ label: 'Platform', value: s.platform })
    if (durasi) meta.push({ label: 'Durasi', value: durasi })

    return {
      id: s.id,
      channel: 'remote' as const,
      channelLabel: 'Remote',
      statusLabel: badge.label,
      statusTone: badge.tone,
      reference: s.remoteId,
      summary: truncateMonitoringText(s.description ?? 'Permintaan remote support tanpa deskripsi.'),
      subject: s.platform ?? 'Remote support',
      user: partyDto(s.user as PartyRecord),
      teknisi: partyDto(s.teknisi as PartyRecord),
      updatedAt: s.updatedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      timeLabel: formatMonitoringRelativeTime(s.updatedAt),
      meta,
    }
  })
}

async function loadStats(): Promise<MonitoringStats> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    totalChat,
    totalKonsultasi,
    totalRemote,
    activeKonsultasi,
    activeRemote,
    pendingKonsultasi,
    pendingRemote,
    unreadMessages,
    chatActiveToday,
    konsultasiActiveToday,
    remoteActiveToday,
    chatParticipantPairs,
  ] = await Promise.all([
    prisma.chatConversation.count(),
    prisma.konsultasiSession.count(),
    prisma.remoteSession.count(),
    prisma.konsultasiSession.count({
      where: { status: { in: ['ACTIVE', 'AWAITING_CONFIRMATION'] } },
    }),
    prisma.remoteSession.count({ where: { status: { in: ['ACCEPTED', 'IN_PROGRESS'] } } }),
    prisma.konsultasiSession.count({ where: { status: 'PENDING' } }),
    prisma.remoteSession.count({ where: { status: 'WAITING' } }),
    prisma.chatMessage.count({ where: { readAt: null } }),
    prisma.chatConversation.count({ where: { lastMessageAt: { gte: startOfToday } } }),
    prisma.konsultasiSession.count({ where: { updatedAt: { gte: startOfToday } } }),
    prisma.remoteSession.count({ where: { updatedAt: { gte: startOfToday } } }),
    prisma.chatConversation.findMany({ select: { userId: true, teknisiId: true } }),
  ])

  const participantSet = new Set<string>()
  for (const pair of chatParticipantPairs) {
    participantSet.add(pair.userId)
    participantSet.add(pair.teknisiId)
  }

  return {
    totalChat,
    totalKonsultasi,
    totalRemote,
    liveSessions: activeKonsultasi + activeRemote,
    pendingSessions: pendingKonsultasi + pendingRemote,
    unreadMessages,
    totalParticipants: participantSet.size,
    activeToday: chatActiveToday + konsultasiActiveToday + remoteActiveToday,
  }
}

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const tab = (url.searchParams.get('tab') ?? 'all') as 'all' | 'chat' | 'konsultasi' | 'remote'
  const q = url.searchParams.get('q')

  try {
    const tasks: Array<Promise<MonitoringActivityItem[]>> = []
    const wantChat = tab === 'all' || tab === 'chat'
    const wantKonsultasi = tab === 'all' || tab === 'konsultasi'
    const wantRemote = tab === 'all' || tab === 'remote'

    if (wantChat) tasks.push(loadChatItems(q))
    if (wantKonsultasi) tasks.push(loadKonsultasiItems(q))
    if (wantRemote) tasks.push(loadRemoteItems(q))

    const [stats, ...lists] = await Promise.all([loadStats(), ...tasks])

    const items = lists.flat().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return apiSuccess({ items, stats })
  } catch (e) {
    console.error('[ADMIN_MONITORING_GET]', e)
    return apiError('Gagal memuat data monitoring', 500)
  }
}
