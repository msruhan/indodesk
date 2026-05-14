'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
  completed: { 1: boolean; 2: boolean; 3: boolean }
}

const steps = [
  { id: 1, label: 'Akun' },
  { id: 2, label: 'Nominal' },
  { id: 3, label: 'Pembayaran' },
] as const

export function StepIndicator({ currentStep, completed }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((step, idx) => {
        const done = completed[step.id as 1 | 2 | 3]
        const active = currentStep === step.id

        return (
          <div key={step.id} className="flex flex-1 items-center gap-1 sm:gap-2">
            <div className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors duration-300',
                  done
                    ? 'bg-primary-500 text-white'
                    : active
                    ? 'bg-ink text-white'
                    : 'bg-surface-200 text-surface-500',
                )}
              >
                {done ? (
                  <CheckCircle weight="fill" className="h-4 w-4" />
                ) : (
                  <span>{step.id}</span>
                )}
                {active && !done && (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-2 ring-ink/20"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors duration-300',
                  active || done ? 'text-ink' : 'text-surface-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 transition-colors duration-300',
                  done ? 'bg-primary-300' : 'bg-surface-200',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
