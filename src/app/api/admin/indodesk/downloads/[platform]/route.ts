import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { platformSlugToEnum, roleSlugToEnum, serializeIndodeskDownload } from '@/lib/indodesk-download'
import { updateIndodeskDownloadSchema } from '@/lib/validations/indodesk-download'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/indodesk/downloads/[platform] — platform: windows | macos */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { platform: platformParam } = await context.params
  const platform = platformSlugToEnum(platformParam)
  if (!platform) return apiError('Platform tidak valid (windows atau macos)', 400)

  const roleParam = new URL(req.url).searchParams.get('role') ?? 'user'
  const role = roleSlugToEnum(roleParam)
  if (!role) return apiError('Peran tidak valid (user atau teknisi)', 400)

  try {
    const body = await req.json()
    const parsed = updateIndodeskDownloadSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')

    const updated = await prisma.indodeskDownload.update({
      where: { platform_role: { platform, role } },
      data: {
        downloadUrl: parsed.data.downloadUrl,
        version: parsed.data.version,
        fileSize: parsed.data.fileSize ?? null,
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
    })

    return apiSuccess(serializeIndodeskDownload(updated))
  } catch (e) {
    console.error('[ADMIN_INODESK_DOWNLOAD_PATCH]', e)
    return apiError('Gagal menyimpan link download', 500)
  }
}
