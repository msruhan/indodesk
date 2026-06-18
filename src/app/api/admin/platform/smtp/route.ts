import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { getSmtpSettings, saveSmtpSettings } from '@/lib/smtp-settings'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  enabled: z.boolean(),
  host: z.string().max(200),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().max(200),
  from: z.string().email('Alamat From harus email valid'),
  password: z.string().max(200).optional(),
  ...adminStepUpFields,
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const settings = await getSmtpSettings()
    return apiSuccess(settings)
  } catch (e) {
    console.error('[ADMIN_SMTP_GET]', e)
    return apiError('Gagal memuat pengaturan SMTP', 500)
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    if (parsed.data.enabled) {
      if (!parsed.data.host.trim()) {
        return apiError('Host SMTP wajib diisi saat SMTP diaktifkan')
      }
    }

    try {
      await verifyAdminStepUp(session.user.id, {
        confirmPassword: parsed.data.confirmPassword,
        totp: parsed.data.totp,
      })
    } catch (e) {
      if (e instanceof StepUpAuthError) {
        return apiError(e.message, 401, { code: e.code })
      }
      throw e
    }

    const { confirmPassword: _cp, totp: _totp, ...smtpData } = parsed.data
    const settings = await saveSmtpSettings(smtpData)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.smtp.update',
      summary: `Pengaturan SMTP diperbarui (enabled=${settings.enabled}, host=${settings.host || '—'})`,
      severity: 'CRITICAL',
      metadata: {
        enabled: settings.enabled,
        host: settings.host,
        port: settings.port,
        from: settings.from,
      },
    })

    return apiSuccess(settings)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal menyimpan pengaturan SMTP'
    console.error('[ADMIN_SMTP_PATCH]', e)
    return apiError(msg, 400)
  }
}
