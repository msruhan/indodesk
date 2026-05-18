import { z } from 'zod'

export const updateIndodeskDownloadSchema = z.object({
  downloadUrl: z.string().url('URL download tidak valid').max(2000),
  version: z.string().min(1, 'Versi wajib diisi').max(32),
  fileSize: z.string().max(32).optional().nullable(),
  isActive: z.boolean().optional(),
})
