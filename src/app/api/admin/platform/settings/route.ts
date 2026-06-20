import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { getPlatformSettings, savePlatformSettings, warmComingSoonCache } from '@/lib/platform-settings'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const settingsSchema = z.object({
  platformName: z.string().min(2).max(120),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(6).max(40),
  adminEmail: z.string().email(),
  buyerFeePercent: z.number().min(0).max(100),
  buyerFlatFeePerItem: z.number().int().min(0).max(1_000_000),
  sellerFeePercent: z.number().min(0).max(100),
  konsultasiFeePercent: z.number().min(0).max(100),
  inspeksiFeePercent: z.number().min(0).max(100),
  maintenanceMode: z.boolean(),
  comingSoonEnabled: z.boolean(),
  comingSoonLaunchAt: z.string().nullable(),
  comingSoonHeadline: z.string().min(2).max(160),
  comingSoonMessage: z.string().min(2).max(500),
  imeiServiceEnabled: z.boolean(),
  remoteServiceEnabled: z.boolean(),
  inspectionServiceEnabled: z.boolean(),
  cariTeknisiEnabled: z.boolean(),
  konsultasiServiceEnabled: z.boolean(),
  rekberServiceEnabled: z.boolean(),
  ...adminStepUpFields,
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const settings = await getPlatformSettings()
    await warmComingSoonCache()
    return apiSuccess(settings)
  } catch (e) {
    console.error('[ADMIN_PLATFORM_SETTINGS_GET]', e)
    return apiError('Gagal memuat pengaturan', 500)
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = settingsSchema.safeParse(body)
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

    const { confirmPassword: _cp, totp: _totp, ...settingsData } = parsed.data
    const settings = await savePlatformSettings(settingsData)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.platform.settings.update',
      summary: 'Pengaturan platform diperbarui',
      severity: 'WARNING',
      metadata: {
        maintenanceMode: settings.maintenanceMode,
        comingSoonEnabled: settings.comingSoonEnabled,
        buyerFeePercent: settings.buyerFeePercent,
        sellerFeePercent: settings.sellerFeePercent,
        adminEmail: settings.adminEmail,
      },
    })

    return apiSuccess(settings)
  } catch (e) {
    console.error('[ADMIN_PLATFORM_SETTINGS_PATCH]', e)
    return apiError('Gagal menyimpan pengaturan', 500)
  }
}
