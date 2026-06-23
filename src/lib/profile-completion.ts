import {
  hasCompleteSavedShippingAddress,
  profileToShippingAddress,
  type UserShippingProfileSource,
} from '@/lib/user-shipping-profile'
import { teknisiProfilePath } from '@/lib/teknisi-profile-slug'

export type ProfileCompletionItem = {
  id: string
  label: string
  hint: string
  href: string
}

export type ProfileCompletionStatus = {
  isComplete: boolean
  items: ProfileCompletionItem[]
  progressPercent: number
}

function isFilled(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

export function evaluateUserProfileCompletion(
  source: UserShippingProfileSource,
): ProfileCompletionStatus {
  const items: ProfileCompletionItem[] = []

  if (!isFilled(source.phone)) {
    items.push({
      id: 'phone',
      label: 'Nomor handphone',
      hint: 'Diperlukan untuk kontak dan transaksi',
      href: '/user/akun',
    })
  }

  const shipping = profileToShippingAddress(source)
  const hasAddress =
    isFilled(source.address) || hasCompleteSavedShippingAddress(shipping)

  if (!hasAddress) {
    items.push({
      id: 'address',
      label: 'Alamat',
      hint: 'Lengkapi alamat profil untuk pengiriman dan layanan',
      href: '/user/akun',
    })
  }

  const total = 2
  const completed = total - items.length

  return {
    isComplete: items.length === 0,
    items,
    progressPercent: Math.round((completed / total) * 100),
  }
}

export type TeknisiProfileCompletionSource = {
  phone: string | null
  location: string | null
  description: string | null
  specialty: string[]
  portfolioCount: number
}

export function evaluateTeknisiProfileCompletion(
  source: TeknisiProfileCompletionSource,
  userId?: string,
  profileSlug?: string | null,
): ProfileCompletionStatus {
  const items: ProfileCompletionItem[] = []
  const profileHref = (edit: string) =>
    userId
      ? `${teknisiProfilePath(profileSlug, userId)}?tab=profil&edit=${edit}`
      : '/teknisi/settings'

  if (!isFilled(source.phone)) {
    items.push({
      id: 'phone',
      label: 'Nomor handphone',
      hint: 'Membantu klien menghubungi Anda',
      href: profileHref('hero'),
    })
  }

  if (!isFilled(source.location)) {
    items.push({
      id: 'location',
      label: 'Lokasi / alamat',
      hint: 'Tampil di profil publik teknisi',
      href: profileHref('hero'),
    })
  }

  if (!isFilled(source.description)) {
    items.push({
      id: 'description',
      label: 'Deskripsi profil',
      hint: 'Ceritakan keahlian dan layanan Anda',
      href: profileHref('about'),
    })
  }

  if ((source.specialty ?? []).filter((s) => s.trim()).length === 0) {
    items.push({
      id: 'specialty',
      label: 'Keahlian / spesialisasi',
      hint: 'Tambahkan minimal satu keahlian',
      href: profileHref('skills'),
    })
  }

  if (source.portfolioCount < 1) {
    items.push({
      id: 'portfolio',
      label: 'Portfolio',
      hint: 'Tampilkan contoh pekerjaan Anda',
      href: profileHref('portfolio'),
    })
  }

  const total = 5
  const completed = total - items.length

  return {
    isComplete: items.length === 0,
    items,
    progressPercent: Math.round((completed / total) * 100),
  }
}
