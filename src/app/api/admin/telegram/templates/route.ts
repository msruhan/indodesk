import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import {
  assertTelegramEventKey,
  listEffectiveTemplates,
  saveTemplateOverride,
} from '@/lib/telegram/template-store'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  eventKey: z.string().min(1),
  body: z.string().min(1).max(4000),
  isEnabled: z.boolean(),
  ...adminStepUpFields,
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const templates = await listEffectiveTemplates()
    return apiSuccess(templates)
  } catch (e) {
    console.error('[ADMIN_TELEGRAM_TEMPLATES_GET]', e)
    return apiError('Gagal memuat template Telegram', 500)
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

    const eventKey = assertTelegramEventKey(parsed.data.eventKey)

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

    await saveTemplateOverride(eventKey, parsed.data.body.trim(), parsed.data.isEnabled)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.telegram.template.update',
      summary: `Template Telegram diperbarui: ${eventKey}`,
      severity: 'INFO',
      metadata: { eventKey, isEnabled: parsed.data.isEnabled },
    })

    const templates = await listEffectiveTemplates()
    const updated = templates.find((t) => t.eventKey === eventKey)
    return apiSuccess(updated)
  } catch (e) {
    if (e instanceof Error && e.message === 'EVENT_KEY_INVALID') {
      return apiError('Event tidak dikenali')
    }
    console.error('[ADMIN_TELEGRAM_TEMPLATES_PATCH]', e)
    return apiError('Gagal menyimpan template', 500)
  }
}
