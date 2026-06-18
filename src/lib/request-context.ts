import { AsyncLocalStorage } from 'node:async_hooks'

export type RequestContext = {
  ip: string | null
  userAgent: string | null
}

const storage = new AsyncLocalStorage<RequestContext>()

export function runWithRequestContext<T>(
  ctx: RequestContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn)
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore()
}
