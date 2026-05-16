import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { chatPathForRole } from '@/lib/auth-utils'
import type { UserRole } from '@prisma/client'

export default async function ChatRedirectPage() {
  const session = await auth()
  if (session?.user?.role) {
    redirect(chatPathForRole(session.user.role as UserRole))
  }
  redirect('/login')
}
