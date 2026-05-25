import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getPlatformSettings, savePlatformSettings } from '@/lib/platform-settings'

export const dynamic = 'force-dynamic'

const settingsSchema = z.object({
  platformName: z.string().min(2).max(120),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(6).max(40),
  adminEmail: z.string().email(),
  feePercent: z.number().min(0).max(100),
  maintenanceMode: z.boolean(),
  imeiServiceEnabled: z.boolean(),
  remoteServiceEnabled: z.boolean(),
  inspectionServiceEnabled: z.boolean(),
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const settings = await getPlatformSettings()
    return apiSuccess(settings)
  } catch (e) {
    console.error('[ADMIN_PLATFORM_SETTINGS_GET]', e)
    return apiError('Gagal memuat pengaturan', 500)
  }
}

export async function PATCH(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const settings = await savePlatformSettings(parsed.data)
    return apiSuccess(settings)
  } catch (e) {
    console.error('[ADMIN_PLATFORM_SETTINGS_PATCH]', e)
    return apiError('Gagal menyimpan pengaturan', 500)
  }
}
