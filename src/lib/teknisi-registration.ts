import { z } from 'zod'

export const TEKNISI_SPECIALTY_OPTIONS = [
  'FRP',
  'Flashing / Firmware',
  'Hardware Repair',
  'Software Repair',
  'iPhone Specialist',
  'Android Specialist',
  'Data Recovery',
  'Battery / LCD',
  'Motherboard / IC',
  'Water Damage',
  'Konsultasi Remote',
] as const

export type TeknisiSpecialtyOption = (typeof TEKNISI_SPECIALTY_OPTIONS)[number]

/** Sentinel value for "Lainnya" in the multi-select UI (not stored in DB). */
export const TEKNISI_SPECIALTY_OTHER = '__other__'

export function isPresetSpecialty(value: string): value is TeknisiSpecialtyOption {
  return (TEKNISI_SPECIALTY_OPTIONS as readonly string[]).includes(value)
}

export function splitTeknisiSpecialty(value: string[]) {
  const presets = value.filter(isPresetSpecialty)
  const custom = value.filter((v) => !isPresetSpecialty(v))
  return { presets, custom }
}

export function mergeTeknisiSpecialty(presets: string[], custom: string[]) {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const item of [...presets, ...custom]) {
    const trimmed = item.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(trimmed)
  }
  return merged
}

export const TEKNISI_WORKSHOP_TYPES = [
  { value: 'COUNTER', label: 'Counter HP' },
  { value: 'WORKSHOP', label: 'Bengkel / Workshop' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'ONLINE', label: 'Online / Remote' },
] as const

export type TeknisiWorkshopType = (typeof TEKNISI_WORKSHOP_TYPES)[number]['value']

export type TeknisiApplicationData = {
  workshopType: TeknisiWorkshopType
  brandsHandled: string
  toolsUsed: string
  portfolioUrl: string
  motivation: string
}

export const teknisiRegisterSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100),
  phone: z
    .string()
    .min(10, 'Nomor WhatsApp minimal 10 digit')
    .max(20, 'Nomor WhatsApp terlalu panjang')
    .regex(/^[0-9+\-\s()]+$/, 'Format nomor tidak valid'),
  shippingCityId: z
    .string()
    .min(1, 'Kota wajib dipilih')
    .max(64)
    .refine((v) => v.startsWith('city_'), { message: 'Kota tidak valid' }),
  shippingCityLabel: z.string().min(1, 'Kota wajib dipilih').max(120),
  experience: z.string().min(1, 'Pengalaman wajib diisi').max(80),
  workshopType: z.enum(['COUNTER', 'WORKSHOP', 'FREELANCE', 'ONLINE'], {
    message: 'Jenis usaha wajib dipilih',
  }),
  brandsHandled: z.string().min(2, 'Merek yang ditangani wajib diisi').max(300),
  specialty: z
    .array(z.string().trim().min(1, 'Spesialisasi tidak boleh kosong').max(80))
    .min(1, 'Pilih minimal satu spesialisasi')
    .max(15, 'Maksimal 15 spesialisasi'),
  portfolioUrl: z
    .string()
    .max(300)
    .optional()
    .default('')
    .refine((v) => !v.trim() || /^https?:\/\//i.test(v.trim()), {
      message: 'Link portfolio harus berupa URL (https://...)',
    }),
  motivation: z
    .string()
    .min(30, 'Ceritakan pengalaman minimal 30 karakter')
    .max(2000),
  confirmTechnician: z.literal(true, {
    message: 'Anda harus menyatakan bahwa Anda adalah teknisi handphone',
  }),
})

export const teknisiRegisterProfileSchema = teknisiRegisterSchema.omit({
  name: true,
  email: true,
  password: true,
})

export type TeknisiRegisterProfileInput = z.infer<typeof teknisiRegisterProfileSchema>

export type TeknisiRegisterInput = z.infer<typeof teknisiRegisterSchema>

export function buildApplicationData(
  input: Pick<
    TeknisiRegisterInput,
    'workshopType' | 'brandsHandled' | 'portfolioUrl' | 'motivation' | 'specialty'
  >,
): TeknisiApplicationData {
  return {
    workshopType: input.workshopType,
    brandsHandled: input.brandsHandled.trim(),
    toolsUsed: '',
    portfolioUrl: (input.portfolioUrl ?? '').trim(),
    motivation: input.motivation.trim(),
  }
}

export function normalizeRegisterSpecialty(specialty: string[]): string[] {
  return mergeTeknisiSpecialty(
    specialty.filter(isPresetSpecialty),
    specialty.filter((s) => !isPresetSpecialty(s)),
  )
}

export function workshopTypeLabel(value: string): string {
  return TEKNISI_WORKSHOP_TYPES.find((w) => w.value === value)?.label ?? value
}

/** Simpan kota kerja ke profil teknisi + prefilled checkout (User.shippingCity*). */
export function teknisiWorkCityFields(input: Pick<TeknisiRegisterInput, 'shippingCityId' | 'shippingCityLabel'>) {
  const label = input.shippingCityLabel.trim()
  return {
    location: label,
    shippingCityId: input.shippingCityId.trim(),
    shippingCityLabel: label,
  }
}
