'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Reveal, AuroraBackground } from '@/components/motion'
import { SectionTabs, type SectionTab } from '@/components/mobile/section-tabs'
import { cn } from '@/lib/utils'

type IconType = React.ElementType

export type PageHeroProps = {
  badge?: { icon: IconType; label: string }
  title: ReactNode
  description?: ReactNode
  cta?: { href: string; icon?: IconType; label: string; trailingIcon?: IconType }
  right?: ReactNode
  children?: ReactNode
  /** Mobile section tabs rendered inside the same aurora hero (unified background). */
  sectionTabs?: { tabs: SectionTab[]; layoutId: string }
}

export function PageHero({
  badge,
  title,
  description,
  cta,
  right,
  children,
  sectionTabs,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden pb-6',
        sectionTabs ? 'lg:pt-28' : 'pt-6 sm:pt-10 lg:pt-28',
      )}
    >
      <AuroraBackground intensity="subtle" />

      {sectionTabs && (
        <SectionTabs
          variant="merged"
          tabs={sectionTabs.tabs}
          layoutId={sectionTabs.layoutId}
        />
      )}

      <div
        className={cn(
          'relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
          sectionTabs ? 'pt-4 sm:pt-10' : undefined,
        )}
      >
        <Reveal noBlur>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              {badge && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-primary-50/70 px-3 py-1 text-[11px] font-medium text-primary-700 backdrop-blur-md">
                  <badge.icon className="h-3 w-3" />
                  {badge.label}
                </span>
              )}
              <h1 className="mt-3 text-balance text-[28px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-4xl lg:text-[44px]">
                {title}
              </h1>
              {description && (
                <div className="mt-3 max-w-xl text-pretty text-sm text-surface-600 sm:text-base">
                  {description}
                </div>
              )}
            </div>

            {(cta || right) && (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                {right}
                {cta && (
                  <Link
                    href={cta.href}
                    className="inline-flex items-center gap-2 self-start rounded-full border border-surface-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-surface-700 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink sm:self-auto"
                  >
                    {cta.icon && <cta.icon className="h-3.5 w-3.5 text-primary-600" />}
                    {cta.label}
                    {cta.trailingIcon && <cta.trailingIcon className="h-3 w-3" />}
                  </Link>
                )}
              </div>
            )}
          </div>
        </Reveal>

        {children && (
          <Reveal noBlur delay={0.05}>
            <div className="mt-5">{children}</div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

