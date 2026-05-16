import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'

export { homePathForRole, chatPathForRole, accountPathForRole } from '@/lib/role-routes'
import { homePathForRole } from '@/lib/role-routes'

/**
 * Get the current session on the server side.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return await auth()
}

/**
 * Require authentication — redirects to /login if not authenticated.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session
}

/**
 * Require one of the allowed roles — otherwise redirect to that user's own dashboard.
 */
export async function requireRole(roles: UserRole[]) {
  const session = await requireAuth()
  const role = session.user.role as UserRole
  if (!roles.includes(role)) {
    redirect(homePathForRole(role))
  }
  return session
}
