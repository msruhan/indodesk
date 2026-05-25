import {
  defaultMarketplaceBanners,
  type MarketplaceBanner,
} from '@/data/mock-marketplace-banners'
import {
  normalizeBannerPlacement,
  type BannerPlacement,
} from '@/lib/marketplace-banners'
import {
  defaultPlatformNotifications,
  type PlatformNotification,
} from '@/data/mock-platform-notifications'

const BANNERS_KEY = 'indoteknizi_marketplace_banners'
export const NOTIFICATIONS_KEY = 'indoteknizi_platform_notifications'

export const BANNERS_UPDATED_EVENT = 'indoteknizi:banners-updated'
export const NOTIFICATIONS_UPDATED_EVENT = 'indoteknizi:notifications-updated'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T, eventName: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(eventName))
}

export function loadMarketplaceBanners(): MarketplaceBanner[] {
  const stored = readJson<MarketplaceBanner[] | null>(BANNERS_KEY, null)
  const list = stored ?? defaultMarketplaceBanners
  return list.map(normalizeBannerPlacement)
}

export function saveMarketplaceBanners(banners: MarketplaceBanner[]) {
  writeJson(BANNERS_KEY, banners, BANNERS_UPDATED_EVENT)
}

export function getActiveMarketplaceBanners(
  banners: MarketplaceBanner[],
  placement: BannerPlacement,
): MarketplaceBanner[] {
  return [...banners]
    .map(normalizeBannerPlacement)
    .filter((b) => b.active && b.placement === placement)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function loadPlatformNotifications(): PlatformNotification[] {
  const stored = readJson<PlatformNotification[] | null>(NOTIFICATIONS_KEY, null)
  return stored ?? defaultPlatformNotifications
}

export function savePlatformNotifications(notifications: PlatformNotification[]) {
  writeJson(NOTIFICATIONS_KEY, notifications, NOTIFICATIONS_UPDATED_EVENT)
}
