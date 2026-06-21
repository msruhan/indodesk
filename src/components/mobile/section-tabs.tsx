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
  mobileHeaderLogoWordmarkClass,
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

export function isTabActive(tab: SectionTab, pathname: string | null): boolean {
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
        'inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-full border p-0.5 shadow-soft-xs backdrop-blur-md',
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
              'relative inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-colors duration-300 sm:px-2.5 sm:text-[11px]',
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
            <tab.icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="relative z-10 truncate">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function SectionTabDropdown({
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
    <div ref={rootRef} className="relative min-w-0 max-w-[6.75rem] shrink sm:max-w-[7.5rem]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'inline-flex w-full min-w-0 items-center justify-between gap-1 rounded-full border py-1 pl-2 pr-1.5 text-[10px] font-semibold shadow-soft-xs backdrop-blur-md transition-colors sm:text-[11px]',
          isMerged
            ? 'border-white/60 bg-gradient-to-br from-primary-500 to-primary-600 text-white'
            : 'border-surface-200/70 bg-white/80 text-ink',
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-1">
          <ActiveIcon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">{activeTab.label}</span>
        </span>
        <ChevronDown
          className={cn('h-3 w-3 shrink-0 transition-transform sm:h-3.5 sm:w-3.5', open && 'rotate-180')}
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
            className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[9.5rem] overflow-hidden rounded-xl border border-surface-200/80 bg-white/95 p-1 shadow-soft-lg backdrop-blur-xl"
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
  const useDropdown = tabs.length >= 2
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
          isMerged
            ? cn('mobile-merged-header-bg', scrolled && 'is-scrolled')
            : cn(
                'border-b border-surface-200/55 bg-white/90 shadow-soft-xs backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300',
                scrolled && 'border-transparent bg-transparent shadow-none backdrop-blur-none',
              ),
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center"
            aria-label="Beranda Bantoo"
          >
            <BrandLogo variant="wordmark" wordmarkClassName={mobileHeaderLogoWordmarkClass} />
          </Link>
          {useDropdown ? (
            <SectionTabDropdown tabs={tabs} isMerged={isMerged} isActive={isActive} />
          ) : (
            <SectionTabPills
              tabs={tabs}
              layoutId={layoutId}
              isMerged={isMerged}
              isActive={isActive}
            />
          )}
        </div>
        <PublicHeaderActions />
      </div>
      <div className={mobileSectionTabsSpacerClass} aria-hidden />
    </>
  )
}
