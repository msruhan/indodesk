'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Bell,
  Plus,
  Calendar,
  ChevronDown,
} from '@/lib/icons'

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/60 bg-white/75 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Search — Linear/Raycast inspired */}
        <div className="flex max-w-md flex-1 items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              type="text"
              placeholder="Cari order, user, produk…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-full bg-white/60 pl-10 pr-16"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-surface-200/80 bg-white px-1.5 py-0.5 text-[10px] font-medium text-surface-500 sm:inline-flex">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="hidden md:inline-flex h-10 items-center gap-2 rounded-full border border-surface-200/80 bg-white/60 px-3 text-sm text-surface-600 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink">
            <Calendar className="h-4 w-4" />
            <span>Mei 2026</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-200/80 bg-white/60 text-surface-600 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1.5 right-1.5 inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          </motion.button>

          <Button size="sm" variant="primary" className="h-10">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
