'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Bell, 
  Plus,
  Calendar,
  ChevronDown
} from 'lucide-react'

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6">
      {/* Left Side - Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <Input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface-50 border-surface-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-3">
        {/* Date Selector */}
        <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
          <Calendar className="w-4 h-4" />
          <span>Dec 2024</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors">
          <Bell className="w-5 h-5 text-surface-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Quick Add */}
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </Button>
      </div>
    </header>
  )
}
