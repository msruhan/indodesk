import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { buildSmtpTestEmail, sendEmail } from '@/lib/email'
import { getSmtpRuntimeConfig } from '@/lib/smtp-settings'

export const dynamic = 'force-dynamic'

const postSchema = z.object({
  to: z.string().email().optional(),
})

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  let body: unknown = {}
  try {
    const text = await req.text()
    if (text.trim()) body = JSON.parse(text)
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const cfg = await getSmtpRuntimeConfig()
  if (!cfg) {
    return apiError(
      'SMTP belum dikonfigurasi. Aktifkan dan simpan pengaturan SMTP di halaman ini terlebih dahulu.',
      400,
      { code: 'SMTP_NOT_CONFIGURED' },
    )
  }

  const to = parsed.data.to ?? session.user.email
  if (!to) {
    return apiError('Email tujuan tidak ditemukan', 400)
  }

  try {
    const payload = buildSmtpTestEmail(cfg.host)
    await sendEmail({ ...payload, to })
    return apiSuccess({ sentTo: to })
  } catch (e) {
    console.error('[ADMIN_SMTP_TEST]', e)
    const msg = e instanceof Error ? e.message : 'Gagal mengirim email uji'
    return apiError(msg, 500)
  }
}
