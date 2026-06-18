import { z } from 'zod'

export const supportTicketCategorySchema = z.enum([
  'SERVICE_ISSUE',
  'KONSULTASI',
  'INSPEKSI',
  'MARKETPLACE',
  'ACCOUNT_SECURITY',
  'PLATFORM_BUG',
  'OTHER',
])

export const supportTicketPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])

export const supportTicketRelatedTypeSchema = z.enum([
  'KONSULTASI',
  'REMOTE',
  'INSPEKSI',
  'MARKETPLACE_ORDER',
  'OTHER',
])

export const createSupportTicketSchema = z
  .object({
    category: supportTicketCategorySchema,
    priority: supportTicketPrioritySchema.default('NORMAL'),
    subject: z.string().trim().min(10, 'Judul minimal 10 karakter').max(120),
    description: z.string().trim().min(30, 'Deskripsi minimal 30 karakter'),
    relatedType: supportTicketRelatedTypeSchema.optional().nullable(),
    relatedId: z.string().trim().optional().nullable(),
    relatedLabel: z.string().trim().optional().nullable(),
    relatedManualNote: z.string().trim().optional().nullable(),
    previousTicketId: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.relatedType === 'OTHER') {
      if (!data.relatedManualNote || data.relatedManualNote.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Keterangan manual minimal 10 karakter jika memilih Lainnya',
          path: ['relatedManualNote'],
        })
      }
    } else if (data.relatedType && !data.relatedId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pilih layanan terkait dari daftar',
        path: ['relatedId'],
      })
    }
  })

export const supportTicketMessageSchema = z.object({
  body: z.string().trim().min(1, 'Pesan tidak boleh kosong'),
  isInternal: z.boolean().optional().default(false),
})

export const adminUpdateSupportTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_REPORTER', 'RESOLVED']).optional(),
  priority: supportTicketPrioritySchema.optional(),
  assignedAdminId: z.string().nullable().optional(),
})
