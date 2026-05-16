import { requireRole } from '@/lib/auth-utils'
import { DashboardShell } from './dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['USER'])
  return <DashboardShell>{children}</DashboardShell>
}
