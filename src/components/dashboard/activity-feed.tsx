'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  staggerContainerFast,
  viewportRevealNoBlur,
} from '@/components/motion'
import {
  FileText,
  DollarSign,
  MessageSquare,
  CheckCircle,
  Clock,
  UserPlus,
} from '@/lib/icons'
import type { IconType } from '@/lib/icons-types'

interface Activity {
  id: number
  title: string
  description: string
  amount?: string
  time: string
  icon: IconType
  iconColor: string
  iconBg: string
}

const activities: readonly Activity[] = [
  {
    id: 1,
    title: 'Payment received',
    description: 'TechCorp Inc. paid invoice #1234',
    amount: '+$2,400.00',
    time: '2 min ago',
    icon: DollarSign,
    iconColor: 'text-primary-700',
    iconBg: 'bg-primary-50 ring-primary-200/60',
  },
  {
    id: 2,
    title: 'Task completed',
    description: 'Homepage design finalized',
    time: '15 min ago',
    icon: CheckCircle,
    iconColor: 'text-primary-700',
    iconBg: 'bg-primary-50 ring-primary-200/60',
  },
  {
    id: 3,
    title: 'New comment',
    description: 'Sarah left feedback on wireframes',
    time: '1 hour ago',
    icon: MessageSquare,
    iconColor: 'text-amber-700',
    iconBg: 'bg-amber-50 ring-amber-200/60',
  },
  {
    id: 4,
    title: 'Invoice sent',
    description: 'Invoice #1235 sent to StartupXYZ',
    amount: '$3,500.00',
    time: '2 hours ago',
    icon: FileText,
    iconColor: 'text-violet-700',
    iconBg: 'bg-violet-50 ring-violet-200/60',
  },
  {
    id: 5,
    title: 'Time logged',
    description: '4.5 hours on Mobile App project',
    time: '3 hours ago',
    icon: Clock,
    iconColor: 'text-rose-700',
    iconBg: 'bg-rose-50 ring-rose-200/60',
  },
  {
    id: 6,
    title: 'New client added',
    description: 'Fashion Store joined your workspace',
    time: '5 hours ago',
    icon: UserPlus,
    iconColor: 'text-accent-700',
    iconBg: 'bg-accent-50 ring-accent-200/60',
  },
] as const

export function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="mt-1 text-sm text-surface-500">
          Latest updates from your workspace
        </p>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="relative"
        >
          {/* Timeline rail */}
          <div
            aria-hidden
            className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-surface-200/0 via-surface-200/80 to-surface-200/0"
          />

          <div className="space-y-4">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                variants={viewportRevealNoBlur}
                className="group/act relative flex gap-3"
              >
                <div
                  className={`relative z-10 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-450 group-hover/act:scale-105 ${activity.iconBg}`}
                >
                  <activity.icon className={`h-[18px] w-[18px] ${activity.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">
                      {activity.title}
                    </p>
                    {activity.amount && (
                      <span className="flex-shrink-0 text-sm font-semibold text-primary-700 tabular-nums">
                        {activity.amount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-surface-600">
                    {activity.description}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
