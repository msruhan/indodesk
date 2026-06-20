import { prisma } from '@/lib/db'
import type {
  NotificationIconKey,
  NotificationTone,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import { sortNotificationsNewestFirst } from '@/lib/platform-notifications'

function formatDeadline(iso: string | null): string {
  if (!iso) return '48 jam'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return '48 jam'
  }
}

function userConfirmNotification(
  partial: Omit<PlatformNotification, 'audiences' | 'active' | 'kind'>,
): PlatformNotification {
  return {
    ...partial,
    audiences: ['USER'],
    active: true,
    kind: 'order',
  }
}

/** Prompt user untuk konfirmasi selesai setelah teknisi mark-done. */
export async function fetchUserKonsultasiConfirmNotifications(
  userId: string,
): Promise<PlatformNotification[]> {
  const rows = await prisma.konsultasiSession.findMany({
    where: { userId, status: 'AWAITING_CONFIRMATION' },
    orderBy: { teknisiMarkedDoneAt: 'desc' },
    take: 10,
    include: { teknisi: { select: { name: true } } },
  })

  const items = rows.map((row) => {
    const teknisiName = row.teknisi.name ?? 'teknisi'
    const deadline = formatDeadline(row.confirmDeadlineAt?.toISOString() ?? null)
    return userConfirmNotification({
      id: `konsultasi-confirm-${row.id}`,
      title: 'Konfirmasi konsultasi selesai',
      body: `${teknisiName} menandai layanan selesai. Konfirmasi sebelum ${deadline} atau otomatis selesai.`,
      tone: 'warning' as NotificationTone,
      icon: 'message' as NotificationIconKey,
      createdAt: (row.teknisiMarkedDoneAt ?? row.updatedAt).toISOString(),
      href: '/user/konsultasi',
    })
  })

  return sortNotificationsNewestFirst(items)
}
