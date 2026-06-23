/** Status konsultasi yang mengizinkan unlock IndoDesk + remote */
export const INODESK_UNLOCK_STATUSES = ['ACTIVE', 'AWAITING_CONFIRMATION'] as const

export type IndodeskUnlockStatus = (typeof INODESK_UNLOCK_STATUSES)[number]

export function isIndodeskRemoteOtpVisible(
  dbStatus: string,
  requiresRemote: boolean,
): boolean {
  if (!requiresRemote) return false
  return (INODESK_UNLOCK_STATUSES as readonly string[]).includes(dbStatus)
}

export type IndodeskSessionPreflight = {
  canUnlock: boolean
  sessionId: string | null
  status: string | null
  hasOtp: boolean
  remoteId: string | null
  confirmDeadlineAt: string | null
  reason: string | null
}

export function buildIndodeskSessionPreflight(session: {
  id: string
  status: string
  remoteId: string | null
  remoteOtp: string | null
  confirmDeadlineAt: Date | null
} | null): IndodeskSessionPreflight {
  if (!session?.remoteId || !session.remoteOtp) {
    return {
      canUnlock: false,
      sessionId: null,
      status: null,
      hasOtp: false,
      remoteId: null,
      confirmDeadlineAt: null,
      reason: 'Tidak ada sesi konsultasi remote yang aktif',
    }
  }
  return {
    canUnlock: true,
    sessionId: session.id,
    status: session.status,
    hasOtp: true,
    remoteId: session.remoteId,
    confirmDeadlineAt: session.confirmDeadlineAt?.toISOString() ?? null,
    reason: null,
  }
}

export type IndodeskHeartbeatStatus = {
  sessionActive: boolean
  sessionId: string | null
  shouldLogout: boolean
  status: string | null
}

export function buildIndodeskHeartbeatStatus(session: {
  id: string
  status: string
  remoteOtp: string | null
} | null): IndodeskHeartbeatStatus {
  const sessionActive = session != null && session.remoteOtp != null
  return {
    sessionActive,
    sessionId: session?.id ?? null,
    shouldLogout: !sessionActive,
    status: session?.status ?? null,
  }
}
