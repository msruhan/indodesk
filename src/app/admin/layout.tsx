import { requireRole } from '@/lib/auth-utils'
import { AdminShell } from './admin-shell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['ADMIN'])
  return <AdminShell>{children}</AdminShell>
}
