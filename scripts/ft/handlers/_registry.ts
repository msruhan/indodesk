export type TestFn = () => Promise<void>

export class HandlerRegistry {
  readonly map = new Map<string, TestFn>()

  api(id: string, fn: TestFn): void {
    this.map.set(id, fn)
  }

  skip(id: string, reason: string): void {
    this.map.set(id, async () => {
      const { skip } = await import('../lib')
      skip(reason)
    })
  }

  skipMany(ids: string[], reason: string): void {
    for (const id of ids) this.skip(id, reason)
  }
}
