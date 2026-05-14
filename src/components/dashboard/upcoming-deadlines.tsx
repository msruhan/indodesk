'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, AlertTriangle } from '@/lib/icons'

const deadlines = [
  {
    id: 1,
    task: 'Submit homepage mockups',
    project: 'Website Redesign',
    dueDate: 'Tomorrow',
    daysLeft: 1,
    priority: 'high',
  },
  {
    id: 2,
    task: 'Client presentation',
    project: 'Brand Identity Design',
    dueDate: 'Dec 22',
    daysLeft: 2,
    priority: 'high',
  },
  {
    id: 3,
    task: 'API integration review',
    project: 'Mobile App Development',
    dueDate: 'Dec 25',
    daysLeft: 5,
    priority: 'medium',
  },
  {
    id: 4,
    task: 'Final delivery milestone',
    project: 'E-commerce Platform',
    dueDate: 'Jan 5',
    daysLeft: 16,
    priority: 'low',
  },
]

const priorityConfig = {
  high: { color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  low: { color: 'text-accent-600', bg: 'bg-accent-50', icon: Calendar },
}

export function UpcomingDeadlines() {
  return (
    <Card className="h-full">
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <p className="text-sm text-surface-500 mt-1">Tasks due soon</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deadlines.map((deadline) => {
              const priority = priorityConfig[deadline.priority as keyof typeof priorityConfig]
              return (
                <div
                  key={deadline.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-surface-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  {/* Priority Icon */}
                  <div className={`w-9 h-9 rounded-lg ${priority.bg} flex items-center justify-center flex-shrink-0`}>
                    <priority.icon className={`w-4 h-4 ${priority.color}`} />
                  </div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {deadline.task}
                    </p>
                    <p className="text-xs text-surface-500 truncate">{deadline.project}</p>
                  </div>

                  {/* Due Date */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${
                      deadline.daysLeft <= 2 ? 'text-rose-600' : 'text-white'
                    }`}>
                      {deadline.dueDate}
                    </p>
                    <p className="text-xs text-surface-500">
                      {deadline.daysLeft === 1 ? '1 day left' : `${deadline.daysLeft} days left`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
  )
}

