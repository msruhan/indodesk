import { requireRole } from '@/lib/auth-utils'
import { UserShell } from './user-shell'

export const dynamic = 'force-dynamic'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['USER'])
  return <UserShell>{children}</UserShell>
}
