'use client'

import { motion } from 'framer-motion'
import { CategoryIcon } from '@/components/topup/shared/category-icon'
import { topupCategories } from '@/data/mock-topup'
import type { TopupCategorySlug } from '@/data/topup-types'
import { cn } from '@/lib/utils'

interface CategoryTabsProps {
  active: TopupCategorySlug | 'all'
  onChange: (slug: TopupCategorySlug | 'all') => void
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="-mx-4 sm:mx-0">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-1">
        <Pill active={active === 'all'} onClick={() => onChange('all')}>
          Semua
        </Pill>
        {topupCategories.map((cat) => (
          <Pill
            key={cat.slug}
            active={active === cat.slug}
            onClick={() => onChange(cat.slug)}
          >
            <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" />
            {cat.label}
          </Pill>
        ))}
      </div>
    </div>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-medium transition-colors duration-300',
        active ? 'text-white' : 'border border-surface-200/70 bg-white/80 text-surface-700 backdrop-blur-md hover:text-ink',
      )}
      aria-pressed={active}
    >
      {active && (
        <motion.span
          layoutId="topup-category-pill"
          className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-glow-primary"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </button>
  )
}
