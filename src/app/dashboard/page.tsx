'use client'

import { 
  StatsCards, 
  RevenueChart, 
  ProjectsList, 
  ActivityFeed,
  ClientsChart,
  UpcomingDeadlines
} from '@/components/dashboard'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Welcome back, John!</h1>
          <p className="text-sm text-surface-500 mt-1">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ClientsChart />
        </div>
      </div>

      {/* Projects & Activity Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectsList />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Deadlines */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingDeadlines />
        <div className="bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Quick Tips</h3>
          <p className="text-white/80 mb-4">
            Boost your productivity with these tips:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">1</span>
              <span>Track time on every task for accurate billing</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">2</span>
              <span>Send invoices within 24 hours of project completion</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">3</span>
              <span>Review your analytics weekly to spot trends</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
