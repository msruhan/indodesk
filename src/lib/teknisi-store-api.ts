import { z } from 'zod'
import {
  normalizeJourneyForDb,
  parseJourneyMilestones,
  parseLayananList,
} from '@/lib/store-content'
import {
  operatingHoursForDb,
  parseOperatingHoursJson,
  summarizeOperatingHours,
} from '@/lib/store-operating-hours'

export const storeFieldsSchema = z.object({
  name: z.string().min(3, 'Nama toko minimal 3 karakter').max(120),
  city: z.string().max(80).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  instagram: z.string().max(64).optional(),
  tiktok: z.string().max(64).optional(),
  jamWeekdays: z.string().max(80).optional(),
  jamWeekend: z.string().max(80).optional(),
  operatingHoursJson: z.string().optional(),
  journeyIntro: z.string().max(280).optional(),
  layanan: z.string().optional(),
  layananJson: z.string().optional(),
  journeyJson: z.string().optional(),
})

export type StoreFieldsInput = z.infer<typeof storeFieldsSchema>

export function parseStoreFormPayload(data: StoreFieldsInput) {
  const layananRaw = data.layananJson?.trim() || data.layanan
  const journeyRaw = data.journeyJson
  const hours = operatingHoursForDb(parseOperatingHoursJson(data.operatingHoursJson))
  const summary = summarizeOperatingHours(hours)

  return {
    name: data.name,
    city: data.city?.trim() || null,
    address: data.address?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    instagram: data.instagram?.trim().replace(/^@/, '') || null,
    tiktok: data.tiktok?.trim().replace(/^@/, '') || null,
    operatingHours: hours,
    jamWeekdays: summary.jamWeekdays ?? (data.jamWeekdays?.trim() || null),
    jamWeekend: summary.jamWeekend ?? (data.jamWeekend?.trim() || null),
    journeyIntro: data.journeyIntro?.trim() || null,
    layanan: parseLayananList(layananRaw),
    journey: normalizeJourneyForDb(parseJourneyMilestones(journeyRaw)),
  }
}

export function readStoreFieldsFromFormData(form: FormData): StoreFieldsInput {
  return {
    name: String(form.get('name') ?? '').trim(),
    city: String(form.get('city') ?? '').trim() || undefined,
    address: String(form.get('address') ?? '').trim() || undefined,
    phone: String(form.get('phone') ?? '').trim() || undefined,
    email: String(form.get('email') ?? '').trim() || undefined,
    instagram: String(form.get('instagram') ?? '').trim() || undefined,
    tiktok: String(form.get('tiktok') ?? '').trim() || undefined,
    operatingHoursJson: String(form.get('operatingHoursJson') ?? ''),
    journeyIntro: String(form.get('journeyIntro') ?? '').trim() || undefined,
    layananJson: String(form.get('layananJson') ?? ''),
    journeyJson: String(form.get('journeyJson') ?? ''),
  }
}
