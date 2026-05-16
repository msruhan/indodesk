import { requireRole } from '@/lib/auth-utils'
import { TeknisiDashboardShell } from './teknisi-dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function TeknisiDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['TEKNISI'])
  return <TeknisiDashboardShell>{children}</TeknisiDashboardShell>
}
