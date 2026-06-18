'use client'

import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'

export default function TeknisiBantuanLayout({ children }: { children: React.ReactNode }) {
  return <TeknisiWorkspaceShell>{children}</TeknisiWorkspaceShell>
}
