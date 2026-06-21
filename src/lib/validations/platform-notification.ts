import { z } from 'zod'

const audienceSchema = z.enum(['USER', 'TEKNISI', 'ADMIN'])
const toneSchema = z.enum(['primary', 'warning', 'success', 'neutral', 'danger'])
const iconSchema = z.enum(['shield', 'message', 'check', 'bell', 'package', 'warning'])

export const createPlatformNotificationSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi'),
  body: z.string().trim().min(1, 'Isi pesan wajib diisi'),
  audiences: z.array(audienceSchema).min(1, 'Pilih minimal satu penerima'),
  tone: toneSchema.default('primary'),
  icon: iconSchema.default('bell'),
  active: z.boolean().default(true),
})

export const updatePlatformNotificationSchema = createPlatformNotificationSchema.partial()
