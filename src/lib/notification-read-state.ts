const STORAGE_PREFIX = 'indoteknizi:notif-read:'
const READ_CHANGE_EVENT = 'indoteknizi:notifications-read-changed'
const MAX_STORED_IDS = 500

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

export function loadReadNotificationIds(userId: string | undefined): Set<string> {
  if (!userId || typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { ids?: string[] }
    if (!Array.isArray(parsed.ids)) return new Set()
    return new Set(parsed.ids.filter((id) => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export function saveReadNotificationIds(userId: string, ids: Set<string>) {
  if (typeof window === 'undefined') return
  const list = [...ids].slice(-MAX_STORED_IDS)
  localStorage.setItem(storageKey(userId), JSON.stringify({ ids: list, updatedAt: new Date().toISOString() }))
  window.dispatchEvent(new Event(READ_CHANGE_EVENT))
}

export function mergeReadNotificationIds(userId: string, newIds: string[]): Set<string> {
  const current = loadReadNotificationIds(userId)
  for (const id of newIds) current.add(id)
  saveReadNotificationIds(userId, current)
  return current
}

export function subscribeNotificationReadState(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => onChange()
  window.addEventListener(READ_CHANGE_EVENT, handler)
  return () => window.removeEventListener(READ_CHANGE_EVENT, handler)
}
