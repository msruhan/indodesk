import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import {
  assertTelegramEventKey,
  listEffectiveTemplates,
  resetTemplateOverride,
} from '@/lib/telegram/template-store'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  ...adminStepUpFields,
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventKey: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { eventKey: rawKey } = await params

  try {
    const eventKey = assertTelegramEventKey(rawKey)
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
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

    await resetTemplateOverride(eventKey)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.telegram.template.reset',
      summary: `Template Telegram direset: ${eventKey}`,
      severity: 'INFO',
      metadata: { eventKey },
    })

    const templates = await listEffectiveTemplates()
    const updated = templates.find((t) => t.eventKey === eventKey)
    return apiSuccess(updated)
  } catch (e) {
    if (e instanceof Error && e.message === 'EVENT_KEY_INVALID') {
      return apiError('Event tidak dikenali', 404)
    }
    console.error('[ADMIN_TELEGRAM_TEMPLATE_RESET]', e)
    return apiError('Gagal reset template', 500)
  }
}
