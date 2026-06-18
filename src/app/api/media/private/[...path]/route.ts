import { apiError, requireApiAuth } from '@/lib/api-auth'
import {
  canAccessPrivateMediaKey,
  normalizePrivateMediaKey,
} from '@/lib/uploads/media-access'
import { readPrivateMediaBody } from '@/lib/media-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(_req: Request, context: RouteContext) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { path } = await context.params
  const key = normalizePrivateMediaKey(path)

  if (!key || key.includes('..')) {
    return new Response('Bad request', { status: 400 })
  }

  const allowed = await canAccessPrivateMediaKey(key, session)
  if (!allowed) {
    return apiError('Akses ditolak', 403)
  }

  const obj = await readPrivateMediaBody(key)
  if (!obj) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(obj.body), {
    headers: {
      'Content-Type': obj.contentType,
      'Cache-Control': 'private, no-store',
    },
  })
}
