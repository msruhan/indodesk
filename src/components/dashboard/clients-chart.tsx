'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const data = [
  { name: 'Web Development', value: 45, color: '#5a6ff1' },
  { name: 'Design', value: 25, color: '#14b894' },
  { name: 'Consulting', value: 20, color: '#f59e0b' },
  { name: 'Other', value: 10, color: '#e11d48' },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-xl border border-surface-200 p-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: payload[0].payload.color }}
          />
          <span className="text-sm font-medium text-surface-900">
            {payload[0].name}
          </span>
        </div>
        <p className="text-lg font-bold text-surface-900 mt-1">
          {payload[0].value}%
        </p>
      </div>
    )
  }
  return null
}

export function ClientsChart() {
  return (
    <Card className="h-full bg-white border border-surface-200">
        <CardHeader className="pb-3 border-b border-surface-200">
          <CardTitle className="text-black">Total Amount</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-black mb-1">24,447</p>
            <div className="flex items-center justify-center gap-1 text-sm text-primary-600">
              <span>↑</span>
              <span>11%</span>
            </div>
          </div>
          
          {/* Simple Bar Representation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-surface-600 mb-2">
              <span>Income</span>
              <span>Expenses</span>
              <span>Transactions</span>
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div className="bg-red-500 flex-1"></div>
              <div className="bg-orange-500 flex-1"></div>
              <div className="bg-purple-500 flex-1"></div>
            </div>
          </div>
        </CardContent>
      </Card>
  )
}
