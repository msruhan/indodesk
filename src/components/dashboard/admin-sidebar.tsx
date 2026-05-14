'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/sidebar-context'
import { 
  Zap, 
  LayoutDashboard, 
  Users, 
  ShoppingBag,
  UserCheck,
  Store,
  Shield,
  Briefcase,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckSquare,
  MessageCircle
} from 'lucide-react'

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Manajemen User', href: '/admin/users' },
  { icon: UserCheck, label: 'Manajemen Teknisi', href: '/admin/teknisi' },
  { icon: ShoppingBag, label: 'Manajemen Produk', href: '/admin/produk' },
  { icon: Store, label: 'Manajemen Toko', href: '/admin/toko' },
  { icon: CheckSquare, label: 'Approval', href: '/admin/approval' },
  { icon: Shield, label: 'Rekber (Escrow)', href: '/admin/rekber' },
  { icon: Briefcase, label: 'Lowongan Kerja', href: '/admin/lowongan' },
  { icon: BarChart3, label: 'Laporan', href: '/admin/laporan' },
]

const bottomNavItems = [
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/admin/help' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <>
      {/* Floating Toggle Button - Always Visible */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed top-4 z-50 w-12 h-12 bg-primary-600/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700/90 transition-all duration-300 hover:scale-110 opacity-50 hover:opacity-100',
          isCollapsed ? 'left-4' : 'left-[260px]'
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>

      {/* Expanded Sidebar */}
      {!isCollapsed && (
        <aside className="fixed left-0 top-0 z-40 h-screen bg-white border-r border-surface-200 transition-all duration-300 w-64 flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between border-b border-surface-200 px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-900">IndoTeknizi</span>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  )}
                >
                  <item.icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-primary-600' : 'text-surface-500'
                  )} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Navigation */}
          <div className="px-3 py-4 border-t border-surface-200 space-y-1">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  )}
                >
                  <item.icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-primary-600' : 'text-surface-500'
                  )} />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* User Profile */}
            <div className="flex items-center gap-3 px-3 py-3 mt-4 rounded-xl bg-surface-50 border border-surface-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">Admin</p>
                <p className="text-xs text-surface-500 truncate">admin@indoteknizi.com</p>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  )
}

