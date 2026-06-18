import type { ReactNode } from 'react'
import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'

export default function TeknisiIklanKonsultasiLayout({ children }: { children: ReactNode }) {
  return <TeknisiWorkspaceShell>{children}</TeknisiWorkspaceShell>
}
