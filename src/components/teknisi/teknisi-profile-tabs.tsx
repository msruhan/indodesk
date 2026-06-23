'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MessageSquare, UserCircle } from '@/lib/icons'

export type TeknisiProfileTab = 'profil' | 'postingan'

const TABS: { id: TeknisiProfileTab; label: string; icon: typeof UserCircle }[] = [
  { id: 'profil', label: 'Profil', icon: UserCircle },
  { id: 'postingan', label: 'Postingan', icon: MessageSquare },
]

function parseTab(raw: string | null): TeknisiProfileTab {
  return raw === 'postingan' ? 'postingan' : 'profil'
}

type TeknisiProfileTabsProps = {
  profilePath: string
  postCount: number
  className?: string
}

export function TeknisiProfileTabs({ profilePath, postCount, className }: TeknisiProfileTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = parseTab(searchParams.get('tab'))

  const setTab = useCallback(
    (tab: TeknisiProfileTab) => {
      const next = tab === 'profil' ? profilePath : `${profilePath}?tab=postingan`
      router.replace(next, { scroll: false })
    },
    [router, profilePath],
  )

  return (
    <div className={cn('overflow-x-auto scrollbar-none', className)}>
      <div className="inline-flex min-w-full gap-1 rounded-full border border-surface-200/80 bg-white/80 p-1 shadow-soft backdrop-blur-md sm:min-w-0">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const selected = active === tab.id
          const countLabel = tab.id === 'postingan' && postCount > 0 ? ` · ${postCount}` : ''

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none sm:px-5',
                selected ? 'text-ink' : 'text-surface-500 hover:text-ink',
              )}
            >
              {selected ? (
                <motion.span
                  layoutId="teknisi-profile-tab"
                  className="absolute inset-0 rounded-full bg-white shadow-soft-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10 inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
                {countLabel}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function useTeknisiProfileTab(): TeknisiProfileTab {
  const searchParams = useSearchParams()
  return parseTab(searchParams.get('tab'))
}
