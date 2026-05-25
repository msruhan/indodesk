import { getR2Object } from '@/lib/r2-storage'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(_req: Request, context: RouteContext) {
  const { path } = await context.params
  const key = path.join('/')

  if (!key || key.includes('..')) {
    return new Response('Bad request', { status: 400 })
  }

  const obj = await getR2Object(key)
  if (!obj) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(obj.body), {
    headers: {
      'Content-Type': obj.contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
