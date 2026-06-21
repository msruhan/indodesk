import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import {
  getPlatformSettings,
  savePlatformSettings,
  serializeHelpSupportContactSettings,
} from '@/lib/platform-settings'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const optionalEmail = z.union([z.literal(''), z.string().email('Email tidak valid')])
const optionalPhone = z.union([
  z.literal(''),
  z.string().min(6, 'Telepon minimal 6 karakter').max(40, 'Telepon terlalu panjang'),
])

const contactFieldSchema = z.object({
  email: optionalEmail,
  phone: optionalPhone,
})

const patchSchema = z.object({
  user: contactFieldSchema,
  teknisi: contactFieldSchema,
  ...adminStepUpFields,
})

/** GET /api/admin/help/contact */
export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const settings = await getPlatformSettings()
    return apiSuccess(serializeHelpSupportContactSettings(settings))
  } catch (e) {
    console.error('[ADMIN_HELP_CONTACT_GET]', e)
    return apiError('Gagal memuat kontak support', 500)
  }
}

/** PATCH /api/admin/help/contact */
export async function PATCH(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
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

    const current = await getPlatformSettings()
    const settings = await savePlatformSettings({
      ...current,
      helpSupportUserEmail: parsed.data.user.email.trim(),
      helpSupportUserPhone: parsed.data.user.phone.trim(),
      helpSupportTeknisiEmail: parsed.data.teknisi.email.trim(),
      helpSupportTeknisiPhone: parsed.data.teknisi.phone.trim(),
    })

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.help.contact.update',
      summary: 'Kontak support Pusat Bantuan diperbarui',
      severity: 'INFO',
    })

    return apiSuccess(serializeHelpSupportContactSettings(settings))
  } catch (e) {
    console.error('[ADMIN_HELP_CONTACT_PATCH]', e)
    return apiError('Gagal menyimpan kontak support', 500)
  }
}
