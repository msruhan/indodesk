import { z } from 'zod'

export const TEKNISI_SPECIALTY_OPTIONS = [
  'Unlock / FRP',
  'Flashing / Firmware',
  'Hardware Repair',
  'Software Repair',
  'iPhone Specialist',
  'Android Specialist',
  'Data Recovery',
  'Battery / LCD',
  'Motherboard',
  'Konsultasi Remote',
] as const

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
  location: z.string().min(2, 'Lokasi wajib diisi').max(120),
  experience: z.string().min(1, 'Pengalaman wajib diisi').max(80),
  workshopType: z.enum(['COUNTER', 'WORKSHOP', 'FREELANCE', 'ONLINE'], {
    message: 'Jenis usaha wajib dipilih',
  }),
  brandsHandled: z.string().min(2, 'Merek yang ditangani wajib diisi').max(300),
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
    'workshopType' | 'brandsHandled' | 'portfolioUrl' | 'motivation'
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

export function workshopTypeLabel(value: string): string {
  return TEKNISI_WORKSHOP_TYPES.find((w) => w.value === value)?.label ?? value
}
