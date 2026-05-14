'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  staggerContainerFast,
  viewportRevealNoBlur,
} from '@/components/motion'
import {
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from '@/lib/icons'

const projects = [
  {
    id: 1,
    name: 'Website Redesign',
    client: 'TechCorp Inc.',
    status: 'in_progress',
    progress: 75,
    dueDate: 'Dec 28, 2024',
    budget: '$12,500',
    accent: 'bg-primary-500',
  },
  {
    id: 2,
    name: 'Mobile App Development',
    client: 'StartupXYZ',
    status: 'in_progress',
    progress: 45,
    dueDate: 'Jan 15, 2025',
    budget: '$28,000',
    accent: 'bg-accent-500',
  },
  {
    id: 3,
    name: 'Brand Identity Design',
    client: 'Coffee House',
    status: 'review',
    progress: 90,
    dueDate: 'Dec 22, 2024',
    budget: '$5,200',
    accent: 'bg-amber-500',
  },
  {
    id: 4,
    name: 'E-commerce Platform',
    client: 'Fashion Store',
    status: 'in_progress',
    progress: 30,
    dueDate: 'Feb 10, 2025',
    budget: '$35,000',
    accent: 'bg-rose-500',
  },
  {
    id: 5,
    name: 'Marketing Dashboard',
    client: 'Analytics Pro',
    status: 'completed',
    progress: 100,
    dueDate: 'Dec 18, 2024',
    budget: '$8,900',
    accent: 'bg-violet-500',
  },
] as const

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
          <p className="mt-1 text-sm text-surface-500">Your ongoing work</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary-700 hover:bg-primary-50">
          View all
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="space-y-3"
        >
          {projects.map((project) => {
            const status = statusConfig[project.status as keyof typeof statusConfig]
            return (
              <motion.div
                key={project.id}
                variants={viewportRevealNoBlur}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="group/proj flex cursor-pointer items-center gap-4 rounded-2xl border border-surface-200/70 bg-white/80 p-4 backdrop-blur-md transition-all duration-300 hover:border-surface-300 hover:shadow-soft-md"
              >
                <div className={`h-12 w-1 rounded-full ${project.accent}`} />

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h4 className="truncate font-medium text-ink transition-colors group-hover/proj:text-primary-700">
                      {project.name}
                    </h4>
                    <Badge variant={status.variant} className="flex-shrink-0">
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-surface-500">{project.client}</p>
                </div>

                <div className="hidden w-32 sm:block">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-surface-500">Progress</span>
                    <span className="font-medium text-surface-700 tabular-nums">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${project.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                      className={`h-full rounded-full ${project.accent}`}
                    />
                  </div>
                </div>

                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-ink tabular-nums">{project.budget}</p>
                  <p className="text-xs text-surface-500">{project.dueDate}</p>
                </div>

                <button
                  className="rounded-lg p-2 text-surface-500 opacity-0 transition-all duration-300 hover:bg-surface-100 hover:text-ink group-hover/proj:opacity-100"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </CardContent>
    </Card>
  )
}
