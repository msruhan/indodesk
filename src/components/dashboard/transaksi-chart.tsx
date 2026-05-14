'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { name: 'Linux', value: 120 },
  { name: 'Mac', value: 150 },
  { name: 'iOS', value: 180 },
  { name: 'Windows', value: 200 },
  { name: 'Android', value: 243, highlight: true },
  { name: 'Other', value: 80 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const highlight = payload[0].payload.highlight
    return (
      <div className="bg-white rounded-lg shadow-xl border border-surface-200 p-3">
        <p className="font-medium text-black mb-1">{label}</p>
        <p className="text-lg font-bold text-black">
          {value}K
        </p>
      </div>
    )
  }
  return null
}

export function TransaksiChart() {
  return (
    <Card className="bg-white border border-surface-200">
      <CardHeader className="pb-3 border-b border-surface-200">
        <CardTitle className="text-black">Device Traffic</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.highlight ? '#22c55e' : '#e5e5e5'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
