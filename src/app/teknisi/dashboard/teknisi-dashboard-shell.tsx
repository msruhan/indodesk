'use client'

import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'

export function TeknisiDashboardShell({ children }: { children: React.ReactNode }) {
  return <TeknisiWorkspaceShell>{children}</TeknisiWorkspaceShell>
}
