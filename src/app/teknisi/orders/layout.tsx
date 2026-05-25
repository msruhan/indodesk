'use client'

import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'

export default function TeknisiOrdersLayout({ children }: { children: React.ReactNode }) {
  return <TeknisiWorkspaceShell>{children}</TeknisiWorkspaceShell>
}
