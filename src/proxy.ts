/**
 * RBAC proxy for dashboard routes (Next.js 16 `proxy` export).
 *
 * Security headers, CSP nonce, CORS, and CSRF Origin/Referer checks run in
 * project-root `middleware.ts` for all matched requests (including `/api/**`).
 */
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

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
    '/teknisi/iklan-konsultasi',
    '/teknisi/iklan-konsultasi/:path*',
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
    '/teknisi/inspeksi',
    '/teknisi/inspeksi/:path*',
    '/teknisi/analitik',
    '/teknisi/analitik/:path*',
    '/teknisi/remote',
    '/teknisi/remote/:path*',
    '/teknisi/rekber',
    '/teknisi/rekber/:path*',
    '/teknisi/settings',
    '/teknisi/settings/:path*',
    '/teknisi/help',
    '/teknisi/help/:path*',
    '/teknisi/bantuan',
    '/teknisi/bantuan/:path*',
    
  ],
}
