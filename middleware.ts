import NextAuth from 'next-auth'
import { NextResponse, type NextRequest } from 'next/server'
import { authConfig } from '@/auth.config'
import { accountPathForRole } from '@/lib/role-routes'
import type { UserRole } from '@prisma/client'
import { corsHeadersForRequest } from '@/lib/security/cors'
import { validateOriginReferer } from '@/lib/security/csrf'
import {
  applySecurityHeadersToResponse,
  generateCspNonce,
  withSecurityRequestHeaders,
} from '@/lib/security/headers'
import { getCachedComingSoon } from '@/lib/coming-soon-cache'
import { shouldBypassComingSoon, isComingSoonForceDisabled } from '@/lib/coming-soon-shared'
import { isPublicShellPath, PUBLIC_SHELL_HEADER } from '@/lib/public-shell-paths'

const { auth } = NextAuth(authConfig)

/** Teknisi workspace (not the public listing /teknisi or /teknisi/[id]). */
const TEKNISI_PRIVATE_PREFIXES = [
  '/teknisi/dashboard',
  '/teknisi/produk',
  '/teknisi/iklan-konsultasi',
  '/teknisi/pesanan',
  '/teknisi/profil',
  '/teknisi/toko',
  '/teknisi/saldo',
  '/teknisi/konsultasi',
  '/teknisi/inspeksi',
  '/teknisi/analitik',
  '/teknisi/remote',
  '/teknisi/rekber',
  '/teknisi/settings',
  '/teknisi/help',
  '/teknisi/bantuan',
] as const

type RouteRule = { prefix: string; roles: readonly string[] }

const PROTECTED_ROUTES: RouteRule[] = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/user', roles: ['USER'] },
  { prefix: '/dashboard', roles: ['USER'] },
  ...TEKNISI_PRIVATE_PREFIXES.map((prefix) => ({
    prefix,
    roles: ['TEKNISI'] as const,
  })),
]

function homePathForRole(role: string): string {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'TEKNISI') return '/teknisi/dashboard'
  return '/user/dashboard'
}

function matchProtectedRoute(pathname: string): RouteRule | undefined {
  return PROTECTED_ROUTES.find(
    (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
  )
}

function finalize(
  req: NextRequest,
  pathname: string,
  buildRes: (requestHeaders: Headers) => NextResponse,
  options?: { comingSoonEnabled?: boolean },
): NextResponse {
  const nonce = generateCspNonce()
  const requestHeaders = withSecurityRequestHeaders(req, pathname, nonce)

  if (isPublicShellPath(pathname, options?.comingSoonEnabled ?? false)) {
    requestHeaders.set(PUBLIC_SHELL_HEADER, '1')
  }

  const res = buildRes(requestHeaders)

  const cors = corsHeadersForRequest(req)
  for (const [k, v] of Object.entries(cors)) {
    res.headers.set(k, v)
  }

  return applySecurityHeadersToResponse(res, pathname, nonce) as NextResponse
}

export const middleware = auth(async (req) => {
  const { pathname } = req.nextUrl

  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return finalize(req, pathname, (requestHeaders) =>
      NextResponse.next({ request: { headers: requestHeaders }, status: 204 }),
    )
  }

  const csrf = validateOriginReferer(req)
  if (!csrf.ok) {
    console.warn('[CSRF_BLOCKED]', req.method, pathname)
    return finalize(req, pathname, () =>
      NextResponse.json(
        { success: false, error: 'Permintaan ditolak (CSRF).', code: 'CSRF_BLOCKED' },
        { status: 403 },
      ),
    )
  }

  const session = req.auth
  const userRole = session?.user?.role as string | undefined

  let comingSoonEnabled = false
  if (!isComingSoonForceDisabled()) {
    const comingSoon = await getCachedComingSoon()
    comingSoonEnabled = Boolean(comingSoon?.enabled)

    if (comingSoonEnabled && !shouldBypassComingSoon(pathname, userRole)) {
      if (pathname.startsWith('/api/')) {
        return finalize(req, pathname, () =>
          NextResponse.json(
            {
              success: false,
              error: 'Platform sedang dalam persiapan peluncuran.',
              code: 'COMING_SOON',
            },
            { status: 503 },
          ),
          { comingSoonEnabled },
        )
      }

      if (pathname !== '/coming-soon') {
        if (pathname === '/') {
          return finalize(
            req,
            pathname,
            (requestHeaders) => {
              const url = req.nextUrl.clone()
              url.pathname = '/coming-soon'
              return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
            },
            { comingSoonEnabled },
          )
        }

        return finalize(
          req,
          pathname,
          () => NextResponse.redirect(new URL('/coming-soon', req.nextUrl.origin)),
          { comingSoonEnabled },
        )
      }
    }
  }

  /** Sesi non-admin saat coming soon — paksa ke halaman gate (admin tetap bypass penuh). */
  if (
    !isComingSoonForceDisabled() &&
    session?.user?.role &&
    session.user.role !== 'ADMIN' &&
    comingSoonEnabled
  ) {
    if (
      pathname !== '/coming-soon' &&
      pathname !== '/login' &&
      !pathname.startsWith('/api/')
    ) {
      if (!pathname.startsWith('/register/') && pathname !== '/register') {
        return finalize(
          req,
          pathname,
          () => NextResponse.redirect(new URL('/coming-soon', req.nextUrl.origin)),
          { comingSoonEnabled },
        )
      }
    }
  }

  const matchedRoute = matchProtectedRoute(pathname)
  if (matchedRoute) {
    if (!session?.user) {
      const loginUrl = new URL('/login', req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return finalize(
        req,
        pathname,
        () => NextResponse.redirect(loginUrl),
        { comingSoonEnabled },
      )
    }

    const userRole = session.user.role as string
    if (!matchedRoute.roles.includes(userRole)) {
      return finalize(
        req,
        pathname,
        () => NextResponse.redirect(new URL(homePathForRole(userRole), req.nextUrl.origin)),
        { comingSoonEnabled },
      )
    }

    if (session.user.mustChangePassword) {
      const accountPath = accountPathForRole(userRole as UserRole)
      const onAccountSettings =
        pathname === accountPath || pathname.startsWith(`${accountPath}/`)
      if (!onAccountSettings) {
        const dest = new URL(accountPath, req.nextUrl.origin)
        dest.searchParams.set('changePassword', 'required')
        return finalize(
          req,
          pathname,
          () => NextResponse.redirect(dest),
          { comingSoonEnabled },
        )
      }
    }
  }

  return finalize(
    req,
    pathname,
    (requestHeaders) => NextResponse.next({ request: { headers: requestHeaders } }),
    { comingSoonEnabled },
  )
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon/).*)'],
}
