import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import {
  getTelegramChannelChatId,
  maskChatId,
  saveTelegramChannelChatId,
} from '@/lib/telegram/channel-config'
import { isTelegramEnabled } from '@/lib/telegram'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  channelChatId: z.string().min(1, 'Chat ID channel wajib diisi').max(32),
  ...adminStepUpFields,
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const channelChatId = await getTelegramChannelChatId()
    return apiSuccess({
      botEnabled: isTelegramEnabled(),
      channelChatId,
      channelChatIdMasked: maskChatId(channelChatId),
      channelConfigured: Boolean(channelChatId),
    })
  } catch (e) {
    console.error('[ADMIN_TELEGRAM_CONFIG_GET]', e)
    return apiError('Gagal memuat konfigurasi Telegram', 500)
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

    await saveTelegramChannelChatId(parsed.data.channelChatId)
    const channelChatId = await getTelegramChannelChatId()

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.telegram.config.update',
      summary: 'Konfigurasi channel Telegram diperbarui',
      severity: 'WARNING',
      metadata: { channelChatIdMasked: maskChatId(channelChatId) },
    })

    return apiSuccess({
      botEnabled: isTelegramEnabled(),
      channelChatId,
      channelChatIdMasked: maskChatId(channelChatId),
      channelConfigured: Boolean(channelChatId),
    })
  } catch (e) {
    console.error('[ADMIN_TELEGRAM_CONFIG_PATCH]', e)
    return apiError('Gagal menyimpan konfigurasi Telegram', 500)
  }
}
