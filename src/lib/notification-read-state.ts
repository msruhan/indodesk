const STORAGE_PREFIX = 'indoteknizi:notif-read:'
const READ_CHANGE_EVENT = 'indoteknizi:notifications-read-changed'
const MAX_STORED_IDS = 500

type StoredReadState = {
  broadcastIds: string[]
  /** monitoring:id → ISO timestamp terakhir yang sudah dilihat */
  monitoring: Record<string, string>
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function emptyState(): StoredReadState {
  return { broadcastIds: [], monitoring: {} }
}

function parseStored(raw: string | null): StoredReadState {
  if (!raw) return emptyState()
  try {
    const parsed = JSON.parse(raw) as {
      ids?: string[]
      broadcastIds?: string[]
      monitoring?: Record<string, string>
    }
    if (Array.isArray(parsed.broadcastIds)) {
      return {
        broadcastIds: parsed.broadcastIds.filter((id) => typeof id === 'string'),
        monitoring:
          parsed.monitoring && typeof parsed.monitoring === 'object'
            ? Object.fromEntries(
                Object.entries(parsed.monitoring).filter(
                  ([, v]) => typeof v === 'string',
                ),
              )
            : {},
      }
    }
    if (Array.isArray(parsed.ids)) {
      return {
        broadcastIds: parsed.ids.filter((id) => typeof id === 'string'),
        monitoring: {},
      }
    }
    return emptyState()
  } catch {
    return emptyState()
  }
}

export function loadReadState(userId: string | undefined): StoredReadState {
  if (!userId || typeof window === 'undefined') return emptyState()
  return parseStored(localStorage.getItem(storageKey(userId)))
}

function saveReadState(userId: string, state: StoredReadState) {
  if (typeof window === 'undefined') return
  const broadcastIds = state.broadcastIds.slice(-MAX_STORED_IDS)
  const monitoring = state.monitoring
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({ broadcastIds, monitoring, updatedAt: new Date().toISOString() }),
  )
  window.dispatchEvent(new Event(READ_CHANGE_EVENT))
}

export function isNotificationRead(
  userId: string | undefined,
  id: string,
  activityAt?: string,
): boolean {
  if (!userId) return false
  const state = loadReadState(userId)
  if (id.startsWith('monitoring:')) {
    const seenAt = state.monitoring[id]
    if (!seenAt || !activityAt) return false
    return new Date(seenAt).getTime() >= new Date(activityAt).getTime()
  }
  return state.broadcastIds.includes(id)
}

export function markNotificationRead(
  userId: string,
  id: string,
  activityAt?: string,
) {
  const state = loadReadState(userId)
  if (id.startsWith('monitoring:')) {
    const at = activityAt ?? new Date().toISOString()
    const prev = state.monitoring[id]
    if (!prev || new Date(at).getTime() > new Date(prev).getTime()) {
      state.monitoring[id] = at
    }
  } else if (!state.broadcastIds.includes(id)) {
    state.broadcastIds.push(id)
  }
  saveReadState(userId, state)
}

export function markAllNotificationsRead(
  userId: string,
  items: Array<{ id: string; createdAt: string }>,
) {
  const state = loadReadState(userId)
  for (const item of items) {
    if (item.id.startsWith('monitoring:')) {
      const prev = state.monitoring[item.id]
      const at = item.createdAt
      if (!prev || new Date(at).getTime() > new Date(prev).getTime()) {
        state.monitoring[item.id] = at
      }
    } else if (!state.broadcastIds.includes(item.id)) {
      state.broadcastIds.push(item.id)
    }
  }
  saveReadState(userId, state)
}

/** @deprecated use loadReadState — kept for compatibility */
export function loadReadNotificationIds(userId: string | undefined): Set<string> {
  const state = loadReadState(userId)
  return new Set([
    ...state.broadcastIds,
    ...Object.keys(state.monitoring),
  ])
}

export function mergeReadNotificationIds(userId: string, newIds: string[]): Set<string> {
  for (const id of newIds) {
    markNotificationRead(userId, id)
  }
  return loadReadNotificationIds(userId)
}

export function subscribeNotificationReadState(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => onChange()
  window.addEventListener(READ_CHANGE_EVENT, handler)
  return () => window.removeEventListener(READ_CHANGE_EVENT, handler)
}
