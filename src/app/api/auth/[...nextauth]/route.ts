import type { NextRequest } from 'next/server'
import { handlers } from '@/auth'
import { extractRequestContext } from '@/lib/activity-log'
import { runWithRequestContext } from '@/lib/request-context'

function withRequestContext(
  handler: (req: NextRequest) => Response | Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return async (req) =>
    runWithRequestContext(extractRequestContext(req), async () => handler(req))
}

export const GET = withRequestContext(handlers.GET)
export const POST = withRequestContext(handlers.POST)
