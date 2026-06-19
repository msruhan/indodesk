'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown } from '@/lib/icons'
import { BrandLogo } from '@/components/brand/brand-logo'
import { PublicHeaderActions } from '@/components/mobile/public-header-actions'
import {
  mobileHeaderBarRowClass,
  mobileSectionTabsSpacerClass,
} from '@/components/mobile/header-action-styles'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

export interface SectionTab {
  href: string
  label: string
  icon: PhosphorIcon
  matchPrefixes?: string[]
}

interface SectionTabsProps {
  tabs: SectionTab[]
  layoutId: string
  variant?: 'default' | 'merged'
}

function isTabActive(tab: SectionTab, pathname: string | null): boolean {
  if (pathname === tab.href) return true
  if (tab.matchPrefixes) {
    return tab.matchPrefixes.some((p) => pathname === p || pathname?.startsWith(`${p}/`))
  }
  return pathname?.startsWith(`${tab.href}/`) ?? false
}

function SectionTabPills({
  tabs,
  layoutId,
  isMerged,
  isActive,
}: {
  tabs: SectionTab[]
  layoutId: string
  isMerged: boolean
  isActive: (tab: SectionTab) => boolean
}) {
  return (
    <div
      className={cn(
        'inline-flex min-w-0 shrink items-center gap-1 rounded-full border p-1 shadow-soft-xs backdrop-blur-md',
        isMerged ? 'border-white/60 bg-white/55' : 'border-surface-200/70 bg-white/80',
      )}
    >
      {tabs.map((tab) => {
        const active = isActive(tab)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-300',
              active ? 'text-white' : 'text-surface-600 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-soft-md"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <tab.icon className="h-3.5 w-3.5" />
            <span className="relative z-10">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

function SectionTabDropdown({
  tabs,
  isMerged,
  isActive,
}: {
  tabs: SectionTab[]
  isMerged: boolean
  isActive: (tab: SectionTab) => boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeTab = tabs.find((tab) => isActive(tab)) ?? tabs[0]
  const ActiveIcon = activeTab.icon

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative min-w-0 shrink">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'inline-flex max-w-[9.5rem] items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-2.5 text-xs font-semibold shadow-soft-xs backdrop-blur-md transition-colors',
          isMerged
            ? 'border-white/60 bg-gradient-to-br from-primary-500 to-primary-600 text-white'
            : 'border-surface-200/70 bg-white/80 text-ink',
        )}
      >
        <ActiveIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{activeTab.label}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[10.5rem] overflow-hidden rounded-xl border border-surface-200/80 bg-white/95 p-1 shadow-soft-lg backdrop-blur-xl"
          >
            {tabs.map((tab) => {
              const active = isActive(tab)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  role="option"
                  aria-selected={active}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-surface-700 hover:bg-surface-50',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  {tab.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SCROLL_TRANSPARENT_THRESHOLD = 20

export function SectionTabs({ tabs, layoutId, variant = 'merged' }: SectionTabsProps) {
  const pathname = usePathname()
  const isMerged = variant === 'merged'
  const useDropdown = tabs.length >= 3
  const isActive = (tab: SectionTab) => isTabActive(tab, pathname)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_TRANSPARENT_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div
        className={cn(
          'fixed inset-x-0 top-0 z-50 overflow-visible pt-[env(safe-area-inset-top,0px)] lg:hidden',
          mobileHeaderBarRowClass,
          'gap-2',
          isMerged
            ? cn('mobile-merged-header-bg', scrolled && 'is-scrolled')
            : cn(
                'border-b border-surface-200/55 bg-white/90 shadow-soft-xs backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300',
                scrolled && 'border-transparent bg-transparent shadow-none backdrop-blur-none',
              ),
        )}
      >
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          aria-label="Beranda Bantoo"
        >
          <BrandLogo variant="icon" iconClassName="h-[4.25rem] w-[4.25rem] scale-[1.45] sm:h-20 sm:w-20 sm:scale-[1.5]" />
        </Link>
        <div className="min-w-0 flex-1">
          {useDropdown ? (
            <SectionTabDropdown tabs={tabs} isMerged={isMerged} isActive={isActive} />
          ) : (
            <SectionTabPills tabs={tabs} layoutId={layoutId} isMerged={isMerged} isActive={isActive} />
          )}
        </div>
        <PublicHeaderActions />
      </div>
      <div className={mobileSectionTabsSpacerClass} aria-hidden />
    </>
  )
}
