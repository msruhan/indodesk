import type {
  SupportTicket,
  SupportTicketMedia,
  SupportTicketMessage,
  User,
} from '@prisma/client'
import type { Prisma } from '@prisma/client'

export type SupportTicketMediaDto = {
  id: string
  kind: SupportTicketMedia['kind']
  url: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export type SupportTicketMessageDto = {
  id: string
  authorId: string
  authorName: string
  authorRole: SupportTicketMessage['authorRole']
  body: string
  isInternal: boolean
  createdAt: string
  media: SupportTicketMediaDto[]
}

export type SupportTicketListItemDto = {
  id: string
  publicId: string
  category: SupportTicket['category']
  priority: SupportTicket['priority']
  status: SupportTicket['status']
  subject: string
  relatedLabel: string | null
  relatedType: SupportTicket['relatedType']
  reporterUnread: boolean
  adminUnread: boolean
  lastMessageAt: string
  createdAt: string
  resolvedAt: string | null
}

export type SupportTicketDetailDto = SupportTicketListItemDto & {
  description: string
  relatedId: string | null
  relatedManualNote: string | null
  relatedSnapshot: unknown
  previousTicketId: string | null
  previousTicketPublicId: string | null
  assignedAdminId: string | null
  assignedAdminName: string | null
  reporter: { id: string; name: string; email: string; role: string }
  messages: SupportTicketMessageDto[]
  media: SupportTicketMediaDto[]
  canReply: boolean
}

export type SupportTicketAdminListItemDto = SupportTicketListItemDto & {
  reporterName: string
  reporterEmail: string
  reporterRole: SupportTicket['reporterRole']
  assignedAdminName: string | null
}

const ticketInclude = {
  reporter: { select: { id: true, name: true, email: true, role: true } },
  assignedAdmin: { select: { id: true, name: true } },
  previousTicket: { select: { id: true, publicId: true } },
  media: { orderBy: { createdAt: 'asc' as const } },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      author: { select: { id: true, name: true } },
      media: { orderBy: { createdAt: 'asc' as const } },
    },
  },
} satisfies Prisma.SupportTicketInclude

export type SupportTicketWithRelations = Prisma.SupportTicketGetPayload<{
  include: typeof ticketInclude
}>

export function mapSupportTicketMedia(row: SupportTicketMedia): SupportTicketMediaDto {
  return {
    id: row.id,
    kind: row.kind,
    url: row.url,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapSupportTicketMessage(
  row: SupportTicketMessage & {
    author: Pick<User, 'id' | 'name'>
    media: SupportTicketMedia[]
  },
): SupportTicketMessageDto {
  return {
    id: row.id,
    authorId: row.authorId,
    authorName: row.author.name,
    authorRole: row.authorRole,
    body: row.body,
    isInternal: row.isInternal,
    createdAt: row.createdAt.toISOString(),
    media: row.media.map(mapSupportTicketMedia),
  }
}

export function mapSupportTicketListItem(row: SupportTicket): SupportTicketListItemDto {
  return {
    id: row.id,
    publicId: row.publicId,
    category: row.category,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    relatedLabel: row.relatedLabel,
    relatedType: row.relatedType,
    reporterUnread: row.reporterUnread,
    adminUnread: row.adminUnread,
    lastMessageAt: row.lastMessageAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  }
}

export function mapSupportTicketDetail(
  row: SupportTicketWithRelations,
  options: { includeInternal?: boolean } = {},
): SupportTicketDetailDto {
  const messages = row.messages
    .filter((m) => options.includeInternal || !m.isInternal)
    .map(mapSupportTicketMessage)

  const initialMedia = row.media.filter((m) => !m.messageId)

  return {
    ...mapSupportTicketListItem(row),
    description: row.description,
    relatedId: row.relatedId,
    relatedManualNote: row.relatedManualNote,
    relatedSnapshot: row.relatedSnapshot,
    previousTicketId: row.previousTicketId,
    previousTicketPublicId: row.previousTicket?.publicId ?? null,
    assignedAdminId: row.assignedAdminId,
    assignedAdminName: row.assignedAdmin?.name ?? null,
    reporter: {
      id: row.reporter.id,
      name: row.reporter.name,
      email: row.reporter.email,
      role: row.reporter.role,
    },
    messages,
    media: initialMedia.map(mapSupportTicketMedia),
    canReply: row.status !== 'RESOLVED',
  }
}

export function mapSupportTicketAdminListItem(
  row: SupportTicket & {
    reporter: Pick<User, 'name' | 'email'>
    assignedAdmin: Pick<User, 'name'> | null
  },
): SupportTicketAdminListItemDto {
  return {
    ...mapSupportTicketListItem(row),
    reporterName: row.reporter.name,
    reporterEmail: row.reporter.email,
    reporterRole: row.reporterRole,
    assignedAdminName: row.assignedAdmin?.name ?? null,
  }
}

export { ticketInclude }
