import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import type { ApprovalEntityType } from '@/lib/approval-queue'
import { loadApprovalDetail } from '@/lib/approval-detail'

export const dynamic = 'force-dynamic'

const VALID_TYPES: ApprovalEntityType[] = ['product', 'store', 'teknisi']

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType') as ApprovalEntityType
    const id = searchParams.get('id')?.trim()

    if (!id || !VALID_TYPES.includes(entityType)) {
      return apiError('Parameter entityType dan id wajib diisi')
    }

    const detail = await loadApprovalDetail(entityType, id)
    if (!detail) return apiError('Data tidak ditemukan', 404)

    return apiSuccess(detail)
  } catch (e) {
    console.error('[ADMIN_APPROVAL_DETAIL_GET]', e)
    return apiError('Gagal memuat detail approval', 500)
  }
}
