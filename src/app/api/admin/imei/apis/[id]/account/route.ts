import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { DhruFusionClient } from '@/lib/dhru-fusion'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/imei/apis/[id]/account
 * Cek saldo/kredit akun reseller API di supplier (accountinfo).
 * CreditprocessError biasanya karena kredit ini habis — bukan harga layanan $0.
 */
export async function GET(
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
    if (api.apiType !== 'DhruFusion') {
      return apiError('Cek saldo hanya untuk DhruFusion Classic', 400)
    }

    const client = new DhruFusionClient({
      host: api.host,
      username: api.username,
      apiKey: api.apiKey,
    })

    const info = await client.accountInfo()
    if (!info.success) {
      return apiError(info.message || 'Gagal mengambil info akun supplier', 502)
    }

    const creditRaw = info.credit ?? '0'
    const creditNum = Number(String(creditRaw).replace(/[^0-9.-]/g, ''))
    const lowBalance = !Number.isFinite(creditNum) || creditNum <= 0

    return apiSuccess({
      apiId: id,
      apiTitle: api.title,
      host: api.host,
      username: api.username,
      credit: creditRaw,
      creditNumeric: Number.isFinite(creditNum) ? creditNum : null,
      lowBalance,
      hint: lowBalance
        ? 'Saldo API reseller kosong atau nol. Top-up di panel luteam.store — meskipun harga layanan $0, Dhru sering tetap menolak placeimeiorder (CreditprocessError).'
        : 'Saldo API tersedia. Jika order masih gagal, cek IMEI valid atau limit layanan.',
    })
  } catch (e) {
    console.error('[ADMIN_IMEI_API_ACCOUNT]', e)
    return apiError('Gagal cek saldo API supplier', 500)
  }
}
