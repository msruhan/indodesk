'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

const projects = [
  {
    id: 1,
    name: 'Website Redesign',
    client: 'TechCorp Inc.',
    status: 'in_progress',
    progress: 75,
    dueDate: 'Dec 28, 2024',
    budget: '$12,500',
    color: 'bg-primary-500',
  },
  {
    id: 2,
    name: 'Mobile App Development',
    client: 'StartupXYZ',
    status: 'in_progress',
    progress: 45,
    dueDate: 'Jan 15, 2025',
    budget: '$28,000',
    color: 'bg-accent-500',
  },
  {
    id: 3,
    name: 'Brand Identity Design',
    client: 'Coffee House',
    status: 'review',
    progress: 90,
    dueDate: 'Dec 22, 2024',
    budget: '$5,200',
    color: 'bg-amber-500',
  },
  {
    id: 4,
    name: 'E-commerce Platform',
    client: 'Fashion Store',
    status: 'in_progress',
    progress: 30,
    dueDate: 'Feb 10, 2025',
    budget: '$35,000',
    color: 'bg-rose-500',
  },
  {
    id: 5,
    name: 'Marketing Dashboard',
    client: 'Analytics Pro',
    status: 'completed',
    progress: 100,
    dueDate: 'Dec 18, 2024',
    budget: '$8,900',
    color: 'bg-violet-500',
  },
]

const statusConfig = {
  in_progress: { label: 'In Progress', variant: 'primary' as const, icon: Clock },
  review: { label: 'In Review', variant: 'warning' as const, icon: AlertCircle },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
}

export function ProjectsList() {
  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Projects</CardTitle>
            <p className="text-sm text-surface-500 mt-1">Your ongoing work</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary-600">
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => {
              const status = statusConfig[project.status as keyof typeof statusConfig]
              return (
                <div
                  key={project.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 hover:border-surface-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                >
                  {/* Color Indicator */}
                  <div className={`w-1 h-12 rounded-full ${project.color}`} />
                  
                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-white truncate group-hover:text-primary-600 transition-colors">
                        {project.name}
                      </h4>
                      <Badge variant={status.variant} className="flex-shrink-0">
                        <status.icon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-surface-500 truncate">{project.client}</p>
                  </div>

                  {/* Progress */}
                  <div className="hidden sm:block w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-surface-500">Progress</span>
                      <span className="font-medium text-surface-700">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${project.color} rounded-full transition-all duration-500`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Due Date & Budget */}
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-white">{project.budget}</p>
                    <p className="text-xs text-surface-500">{project.dueDate}</p>
                  </div>

                  {/* Actions */}
                  <button className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-400 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
  )
}

