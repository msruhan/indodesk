import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  formatMonitoringDuration,
  formatMonitoringPrice,
  formatMonitoringRelativeTime,
  truncateMonitoringText,
  type MonitoringActivityItem,
  type MonitoringChannel,
  type MonitoringChatTranscriptMessage,
  type MonitoringDetailDto,
  type MonitoringPartyDto,
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

function formatChatMessageTime(d: Date) {
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadChatDetail(id: string): Promise<MonitoringDetailDto | null> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: {
      user: { select: PARTY_SELECT },
      teknisi: { select: PARTY_SELECT },
      messages: { orderBy: { createdAt: 'asc' }, take: 500 },
    },
  })
  if (!conversation) return null

  const last = conversation.messages[conversation.messages.length - 1]
  const unread = conversation.messages.filter((m) => m.readAt === null).length
  const updatedAt = (last?.createdAt ?? conversation.lastMessageAt ?? conversation.updatedAt).toISOString()

  const transcript: MonitoringChatTranscriptMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    body: m.body,
    senderId: m.senderId,
    senderName: m.senderId === conversation.userId
      ? conversation.user.name
      : conversation.teknisi.name,
    senderRole: m.senderId === conversation.userId ? 'USER' : 'TEKNISI',
    isFromUser: m.senderId === conversation.userId,
    createdAt: m.createdAt.toISOString(),
    timeLabel: formatChatMessageTime(m.createdAt),
    read: m.readAt !== null,
  }))

  const activity: MonitoringActivityItem = {
    id: conversation.id,
    channel: 'chat',
    channelLabel: 'Chat',
    statusLabel: unread > 0 ? `${unread} belum dibaca` : 'Aktif',
    statusTone: unread > 0 ? 'warning' : 'success',
    reference: null,
    summary: truncateMonitoringText(last?.body ?? 'Belum ada pesan'),
    subject: `${conversation.messages.length} pesan`,
    user: partyDto(conversation.user as PartyRecord),
    teknisi: partyDto(conversation.teknisi as PartyRecord),
    updatedAt,
    createdAt: conversation.createdAt.toISOString(),
    timeLabel: formatMonitoringRelativeTime(updatedAt),
    meta: [
      { label: 'Total pesan', value: String(conversation.messages.length) },
      { label: 'Belum dibaca', value: String(unread) },
    ],
    unreadCount: unread,
  }

  return { activity, transcript }
}

async function loadKonsultasiDetail(id: string): Promise<MonitoringDetailDto | null> {
  const session = await prisma.konsultasiSession.findUnique({
    where: { id },
    include: {
      user: { select: PARTY_SELECT },
      teknisi: { select: PARTY_SELECT },
    },
  })
  if (!session) return null

  const durasi = formatMonitoringDuration(session.startedAt, session.endedAt)
  const status = session.status

  const tone: MonitoringActivityItem['statusTone'] =
    status === 'COMPLETED' ? 'success'
    : status === 'CANCELLED' ? 'danger'
    : status === 'ACTIVE' ? 'info'
    : 'warning'
  const statusLabel =
    status === 'COMPLETED' ? 'Selesai'
    : status === 'CANCELLED' ? 'Dibatalkan'
    : status === 'ACTIVE' ? 'Berjalan'
    : 'Menunggu'

  const meta: Array<{ label: string; value: string }> = [
    { label: 'Biaya', value: formatMonitoringPrice(session.price.toString()) },
  ]
  if (durasi) meta.push({ label: 'Durasi', value: durasi })
  if (session.rating) meta.push({ label: 'Rating', value: `${session.rating} / 5` })

  const activity: MonitoringActivityItem = {
    id: session.id,
    channel: 'konsultasi',
    channelLabel: 'Konsultasi',
    statusLabel,
    statusTone: tone,
    reference: session.id.slice(0, 8).toUpperCase(),
    summary: truncateMonitoringText(session.review ?? `Sesi konsultasi ${session.service.toLowerCase()}.`, 280),
    subject: session.service,
    user: partyDto(session.user as PartyRecord),
    teknisi: partyDto(session.teknisi as PartyRecord),
    updatedAt: session.updatedAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    timeLabel: formatMonitoringRelativeTime(session.updatedAt),
    meta,
  }

  return {
    activity,
    konsultasi: {
      rating: session.rating,
      review: session.review,
      startedAt: session.startedAt?.toISOString() ?? null,
      endedAt: session.endedAt?.toISOString() ?? null,
      durasi,
      price: formatMonitoringPrice(session.price.toString()),
    },
  }
}

async function loadRemoteDetail(id: string): Promise<MonitoringDetailDto | null> {
  const session = await prisma.remoteSession.findUnique({
    where: { id },
    include: {
      user: { select: PARTY_SELECT },
      teknisi: { select: PARTY_SELECT },
    },
  })
  if (!session) return null

  const durasi = formatMonitoringDuration(session.acceptedAt ?? session.createdAt, session.completedAt)
  const status = session.status
  const tone: MonitoringActivityItem['statusTone'] =
    status === 'COMPLETED' ? 'success'
    : status === 'REJECTED' ? 'danger'
    : status === 'ACCEPTED' || status === 'IN_PROGRESS' ? 'info'
    : 'warning'
  const statusLabel =
    status === 'COMPLETED' ? 'Selesai'
    : status === 'REJECTED' ? 'Ditolak'
    : status === 'ACCEPTED' ? 'Diterima'
    : status === 'IN_PROGRESS' ? 'Berlangsung'
    : 'Menunggu'

  const meta: Array<{ label: string; value: string }> = [
    { label: 'Remote ID', value: session.remoteId },
  ]
  if (session.platform) meta.push({ label: 'Platform', value: session.platform })
  if (durasi) meta.push({ label: 'Durasi', value: durasi })

  const activity: MonitoringActivityItem = {
    id: session.id,
    channel: 'remote',
    channelLabel: 'Remote',
    statusLabel,
    statusTone: tone,
    reference: session.remoteId,
    summary: truncateMonitoringText(session.description ?? 'Permintaan remote support tanpa deskripsi.', 280),
    subject: session.platform ?? 'Remote support',
    user: partyDto(session.user as PartyRecord),
    teknisi: partyDto(session.teknisi as PartyRecord),
    updatedAt: session.updatedAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    timeLabel: formatMonitoringRelativeTime(session.updatedAt),
    meta,
  }

  return {
    activity,
    remote: {
      remoteId: session.remoteId,
      platform: session.platform,
      description: session.description,
      acceptedAt: session.acceptedAt?.toISOString() ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
      durasi,
    },
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ channel: string; id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { channel, id } = await params
  if (!id) return apiError('ID tidak valid')

  try {
    let detail: MonitoringDetailDto | null = null
    const ch = channel as MonitoringChannel
    if (ch === 'chat') detail = await loadChatDetail(id)
    else if (ch === 'konsultasi') detail = await loadKonsultasiDetail(id)
    else if (ch === 'remote') detail = await loadRemoteDetail(id)
    else return apiError('Channel tidak dikenali')

    if (!detail) return apiError('Data tidak ditemukan', 404)
    return apiSuccess(detail)
  } catch (e) {
    console.error('[ADMIN_MONITORING_DETAIL_GET]', e)
    return apiError('Gagal memuat detail monitoring', 500)
  }
}
