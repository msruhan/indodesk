'use client'

import { AdminSidebar } from '@/components/dashboard/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard'
import { useSidebar } from '@/contexts/sidebar-context'
import { cn } from '@/lib/utils'
import { DashboardBottomNav, DashboardMobileSpacer } from '@/components/mobile/dashboard-bottom-nav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-surface-50">
      <AdminSidebar />
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
      <DashboardMobileSpacer />
      <DashboardBottomNav />
    </div>
  )
}

