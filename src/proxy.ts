import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

/** Teknisi workspace (not the public listing /teknisi or /teknisi/[id]). */
const TEKNISI_PRIVATE_PREFIXES = [
  '/teknisi/dashboard',
  '/teknisi/produk',
  '/teknisi/pesanan',
  '/teknisi/profil',
  '/teknisi/toko',
  '/teknisi/saldo',
  '/teknisi/konsultasi',
  '/teknisi/analitik',
  '/teknisi/remote',
  '/teknisi/settings',
  '/teknisi/help',
] as const

type RouteRule = { prefix: string; roles: readonly string[] }

/**
 * Strict RBAC: one role per area (no admin impersonating teknisi/user dashboards).
 * Order matters: first match wins.
 */
const PROTECTED_ROUTES: RouteRule[] = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/user', roles: ['USER'] },
  /** Legacy /dashboard — treat as customer workspace */
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

/**
 * RBAC proxy — protects dashboard routes by role.
 * Public: marketplace, /teknisi (listing), /teknisi/[id], topup, etc.
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const matchedRoute = matchProtectedRoute(pathname)

  if (!matchedRoute) return NextResponse.next()

  if (!session?.user) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role as string
  if (!matchedRoute.roles.includes(userRole)) {
    return NextResponse.redirect(new URL(homePathForRole(userRole), req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/teknisi/dashboard',
    '/teknisi/dashboard/:path*',
    '/teknisi/produk',
    '/teknisi/produk/:path*',
    '/teknisi/pesanan',
    '/teknisi/pesanan/:path*',
    '/teknisi/profil',
    '/teknisi/profil/:path*',
    '/teknisi/toko',
    '/teknisi/toko/:path*',
    '/teknisi/saldo',
    '/teknisi/saldo/:path*',
    '/teknisi/konsultasi',
    '/teknisi/konsultasi/:path*',
    '/teknisi/analitik',
    '/teknisi/analitik/:path*',
    '/teknisi/remote',
    '/teknisi/remote/:path*',
    '/teknisi/settings',
    '/teknisi/settings/:path*',
    '/teknisi/help',
    '/teknisi/help/:path*',
  ],
}
