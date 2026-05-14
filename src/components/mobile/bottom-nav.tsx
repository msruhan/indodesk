'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home,
  ShoppingBag,
  Users,
  Store,
  Briefcase,
  MessageCircle
} from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Beranda', href: '/' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/marketplace' },
  { icon: Users, label: 'Teknisi', href: '/teknisi' },
  { icon: Store, label: 'Toko', href: '/toko' },
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-surface-200 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive 
                  ? 'text-primary-600' 
                  : 'text-surface-500 hover:text-surface-900'
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 rounded-b-full" />
              )}
              <item.icon className={cn(
                'w-5 h-5 transition-all',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
