import { apiError, requireApiAuth } from '@/lib/api-auth'
import { canAccessPrivateMediaKey } from '@/lib/uploads/media-access'
import { getSignedUrlForPrivate } from '@/lib/uploads/r2-private'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const key = new URL(req.url).searchParams.get('key')?.trim()
  if (!key || key.includes('..')) {
    return apiError('Parameter key wajib', 400)
  }

  const normalized = key.startsWith('private/') || key.startsWith('local/')
    ? key
    : `private/${key}`

  const allowed = await canAccessPrivateMediaKey(normalized, session)
  if (!allowed) {
    return apiError('Akses ditolak', 403)
  }

  const signed = await getSignedUrlForPrivate(normalized, 3600)
  if (!signed) {
    return apiError('Signed URL tidak tersedia; gunakan /api/media/private', 501)
  }

  return Response.redirect(signed, 302)
}
