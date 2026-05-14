'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  FileText, 
  DollarSign, 
  MessageSquare, 
  CheckCircle,
  Clock,
  UserPlus
} from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'payment',
    title: 'Payment received',
    description: 'TechCorp Inc. paid invoice #1234',
    amount: '+$2,400.00',
    time: '2 min ago',
    icon: DollarSign,
    iconColor: 'text-accent-600',
    iconBg: 'bg-accent-50',
  },
  {
    id: 2,
    type: 'task',
    title: 'Task completed',
    description: 'Homepage design finalized',
    time: '15 min ago',
    icon: CheckCircle,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
  {
    id: 3,
    type: 'comment',
    title: 'New comment',
    description: 'Sarah left feedback on wireframes',
    time: '1 hour ago',
    icon: MessageSquare,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    id: 4,
    type: 'invoice',
    title: 'Invoice sent',
    description: 'Invoice #1235 sent to StartupXYZ',
    amount: '$3,500.00',
    time: '2 hours ago',
    icon: FileText,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
  },
  {
    id: 5,
    type: 'time',
    title: 'Time logged',
    description: '4.5 hours on Mobile App project',
    time: '3 hours ago',
    icon: Clock,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
  },
  {
    id: 6,
    type: 'client',
    title: 'New client added',
    description: 'Fashion Store joined your workspace',
    time: '5 hours ago',
    icon: UserPlus,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50',
  },
]

export function ActivityFeed() {
  return (
    <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <p className="text-sm text-surface-500 mt-1">Latest updates from your workspace</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex gap-3 group"
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg ${activity.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.title}
                    </p>
                    {activity.amount && (
                      <span className="text-sm font-semibold text-accent-600 flex-shrink-0">
                        {activity.amount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 truncate">{activity.description}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
  )
}

