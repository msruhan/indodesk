import { NextResponse } from 'next/server'

/** Load balancer / Docker HEALTHCHECK — no auth, no DB required. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'bantoo',
    ts: new Date().toISOString(),
  })
}
