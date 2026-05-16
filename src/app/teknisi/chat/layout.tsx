'use client'

import { TeknisiSidebar } from '@/components/dashboard/teknisi-sidebar'
import { DashboardHeader } from '@/components/dashboard'
import { useSidebar } from '@/contexts/sidebar-context'
import { cn } from '@/lib/utils'
import { ShellBottomNav, ShellMobileSpacer } from '@/components/mobile/shell-bottom-nav'

export default function TeknisiChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-surface-50">
      <TeknisiSidebar />
      <div 
        className={cn(
          'transition-all duration-300',
          isCollapsed ? 'pl-0' : 'pl-0 lg:pl-64'
        )}
      >
        <DashboardHeader />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
      <ShellMobileSpacer />
      <ShellBottomNav />
    </div>
  )
}

