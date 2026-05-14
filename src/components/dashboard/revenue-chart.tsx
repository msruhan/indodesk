'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { platformGrowth } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const options: ApexOptions = {
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#737373',
    animations: {
      enabled: true,
      speed: 750,
      animateGradually: { enabled: true, delay: 90 },
      dynamicAnimation: { enabled: true, speed: 450 },
    },
  },
  colors: ['#16a34a', '#171717', '#22c55e'],
  dataLabels: { enabled: false },
  stroke: { width: [4, 3, 3], curve: 'smooth' },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 0.6, opacityFrom: 0.28, opacityTo: 0.03, stops: [0, 90, 100] },
  },
  grid: { borderColor: '#f0f0f0', strokeDashArray: 4, xaxis: { lines: { show: false } } },
  legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#525252' } },
  xaxis: {
    categories: platformGrowth.map((item) => item.month),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#737373' } },
  },
  yaxis: { labels: { style: { colors: '#737373' } } },
  tooltip: { theme: 'light', shared: true, intersect: false },
}

const series = [
  { name: 'Users', data: platformGrowth.map((item) => item.users) },
  { name: 'Revenue (jt)', data: platformGrowth.map((item) => item.revenue) },
  { name: 'Konsultasi', data: platformGrowth.map((item) => item.consultations) },
]

export function RevenueChart() {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
      <Card className="bg-white border border-surface-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-surface-200">
          <div>
            <CardTitle className="text-black">Users Projects Operating Status</CardTitle>
            <p className="mt-1 text-sm text-surface-500">Mock data growth overview</p>
          </div>
          <select className="text-sm border border-surface-200 rounded-lg px-3 py-1.5 text-surface-600 bg-white">
            <option>Week</option>
            <option>Month</option>
            <option>Year</option>
          </select>
        </CardHeader>
        <CardContent className="pt-6">
          <Chart options={options} series={series} type="area" height={320} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
