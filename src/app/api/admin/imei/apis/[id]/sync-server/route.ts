import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { decryptImeiApiKey } from '@/lib/crypto/imei-api-secret'
import {
  DhruFusionClient,
  DhruFusionProClient,
  formatServerSyncError,
  isClassicDhruApiKey,
  isServerProProduct,
  resolveProCategoryName,
} from '@/lib/dhru-fusion'

export const dynamic = 'force-dynamic'

type SyncedServerRow = {
  toolId: string
  title: string
  groupName: string
  price: number
  deliveryTime: string
  requiredFields: string
  alreadyImported: boolean
}

/**
 * POST /api/admin/imei/apis/[id]/sync-server
 * Fetch server/file service list from supplier (Classic first, then Pro).
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const api = await prisma.imeiApi.findUnique({ where: { id } })
    if (!api) return apiError('API tidak ditemukan', 404)
    if (api.status !== 'ACTIVE') return apiError('API tidak aktif', 400)

    const existingServices = await prisma.serverService.findMany({
      where: { apiId: id },
      select: { toolId: true },
    })
    const importedToolIds = new Set(existingServices.map((s) => s.toolId).filter(Boolean))

    const mapClassic = (
      services: Array<{
        toolId: string
        title: string
        groupName: string
        price: number
        deliveryTime: string
        requiredFields: string
      }>,
    ): SyncedServerRow[] =>
      services.map((svc) => ({
        ...svc,
        alreadyImported: importedToolIds.has(svc.toolId),
      }))

    const apiKey = decryptImeiApiKey(api.apiKey)

    const classicClient = new DhruFusionClient({
      host: api.host,
      username: api.username,
      apiKey,
    })

    // Classic DhruFusion first (most Indonesian suppliers e.g. luteam use this)
    const classicResult = await classicClient.getServerServiceList()
    if (classicResult.success && classicResult.services.length > 0) {
      const services = mapClassic(classicResult.services)
      return apiSuccess({
        apiId: id,
        apiTitle: api.title,
        apiVersion: 'classic',
        totalServices: services.length,
        alreadyImported: services.filter((s) => s.alreadyImported).length,
        services,
      })
    }

    let proResult: Awaited<ReturnType<DhruFusionProClient['getProducts']>> = {
      success: false,
      error: 'Skipped — Classic API key format',
    }

    if (!isClassicDhruApiKey(apiKey)) {
      const proClient = new DhruFusionProClient({
        host: api.host,
        username: api.username,
        apiKey,
      })
      proResult = await proClient.getProducts()
    }
    const serverProducts =
      proResult.success && proResult.products
        ? proResult.products.filter(isServerProProduct)
        : []

    if (serverProducts.length > 0) {
      const services: SyncedServerRow[] = serverProducts.map((p) => ({
        toolId: p.uuid,
        title: p.name,
        groupName: resolveProCategoryName(proResult.categories, p),
        price: p.price,
        deliveryTime: '',
        requiredFields: JSON.stringify(p.fields || []),
        alreadyImported: importedToolIds.has(p.uuid),
      }))

      return apiSuccess({
        apiId: id,
        apiTitle: api.title,
        apiVersion: 'pro',
        currency: proResult.currency,
        totalServices: services.length,
        alreadyImported: services.filter((s) => s.alreadyImported).length,
        services,
      })
    }

    const message = formatServerSyncError(
      classicResult.error || 'Tidak ada layanan server dari supplier',
      proResult.error,
    )
    return apiError(message, 502)
  } catch (e) {
    console.error('[ADMIN_API_SYNC_SERVER]', e)
    return apiError('Gagal sync server services', 500)
  }
}
