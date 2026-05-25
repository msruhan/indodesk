import type { TeknisiProfile } from '@prisma/client'
import {
  defaultConsultationServices,
  parseConsultationServicesFromProfile,
  type ProfileConsultationService,
} from '@/lib/teknisi-profile-content'

export type TeknisiServiceKind = 'consultation' | 'inspection-online' | 'inspection-offline'

export type TeknisiConsultationService = {
  name: string
  price: number
  duration: string
  description: string
  popular: boolean
  kind: TeknisiServiceKind
}

function toPublicService(
  item: ProfileConsultationService,
  basePrice: number,
): TeknisiConsultationService {
  return {
    name: item.name,
    price: item.price ?? basePrice,
    duration: item.duration,
    description: item.description,
    popular: item.popular,
    kind: 'consultation',
  }
}

/** Bangun layanan inspeksi dari tarif yang diset teknisi. */
export function buildTeknisiInspectionServices(
  profile: Pick<
    TeknisiProfile,
    'providesInspection' | 'inspectionPriceOnline' | 'inspectionPriceOffline'
  >,
): TeknisiConsultationService[] {
  if (!profile.providesInspection) return []

  const items: TeknisiConsultationService[] = []

  if (profile.inspectionPriceOnline != null) {
    items.push({
      name: 'Inspeksi Online',
      price: Number(profile.inspectionPriceOnline),
      duration: '20–40 menit',
      description:
        'Pemeriksaan kondisi HP/Laptop via video call. Teknisi membimbing pengecekan fisik, performa, dan keaslian.',
      popular: false,
      kind: 'inspection-online',
    })
  }

  if (profile.inspectionPriceOffline != null) {
    items.push({
      name: 'Inspeksi Offline',
      price: Number(profile.inspectionPriceOffline),
      duration: '45–90 menit',
      description:
        'Teknisi datang ke lokasi untuk inspeksi langsung. Cek fisik, performa, baterai, hingga laporan tertulis.',
      popular: false,
      kind: 'inspection-offline',
    })
  }

  return items
}

/** Daftar layanan konsultasi — dari profil teknisi atau turunan spesialisasi. */
export function buildTeknisiConsultationServices(
  profile: Pick<TeknisiProfile, 'specialty' | 'price' | 'consultationServices'>,
): TeknisiConsultationService[] {
  const base = Number(profile.price)
  const custom = parseConsultationServicesFromProfile(profile.consultationServices)
  const source =
    custom.length > 0 ? custom : defaultConsultationServices(profile.specialty ?? [], base)
  return source.map((s) => toPublicService(s, base))
}

/** Gabungan layanan konsultasi + inspeksi untuk ditampilkan di "Bandingkan & Pilih". */
export function buildTeknisiAllServices(
  profile: Pick<
    TeknisiProfile,
    | 'specialty'
    | 'price'
    | 'consultationServices'
    | 'providesInspection'
    | 'inspectionPriceOnline'
    | 'inspectionPriceOffline'
  >,
): TeknisiConsultationService[] {
  return [
    ...buildTeknisiConsultationServices(profile),
    ...buildTeknisiInspectionServices(profile),
  ]
}

export function findConsultationService(
  profile: Pick<TeknisiProfile, 'specialty' | 'price' | 'consultationServices'>,
  serviceName: string,
  price: number,
): TeknisiConsultationService | null {
  const services = buildTeknisiConsultationServices(profile)
  const normalized = serviceName.trim().toLowerCase()
  return (
    services.find(
      (s) => s.name.toLowerCase() === normalized && s.price === price,
    ) ?? null
  )
}
