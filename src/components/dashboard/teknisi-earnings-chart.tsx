'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { teknisiEarningsWeekly } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const options: ApexOptions = {
  chart: {
    toolbar: { show: false },
    foreColor: '#71717a',
    animations: { enabled: true, speed: 800 },
  },
  colors: ['#10b981', '#8b5cf6', '#06b6d4'],
  stroke: { curve: 'smooth', width: [3, 2, 2] },
  fill: {
    type: ['gradient', 'solid', 'solid'],
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f4f4f5', strokeDashArray: 4, padding: { left: 8, right: 8 } },
  xaxis: {
    categories: teknisiEarningsWeekly.map((d) => d.week),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#71717a', fontSize: '11px' } },
  },
  yaxis: [
    {
      title: { text: 'Earnings (rb)', style: { color: '#71717a', fontSize: '11px', fontWeight: 500 } },
      labels: { style: { colors: '#71717a', fontSize: '11px' }, formatter: (v) => `${v}` },
    },
    {
      opposite: true,
      title: { text: 'Sesi', style: { color: '#71717a', fontSize: '11px', fontWeight: 500 } },
      labels: { style: { colors: '#71717a', fontSize: '11px' } },
    },
  ],
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', markers: { size: 4 } },
  tooltip: {
    theme: 'light',
    shared: true,
    y: { formatter: (v: number) => `${v}` },
  },
}

const series = [
  { name: 'Earnings', type: 'area', data: teknisiEarningsWeekly.map((d) => d.earnings) },
  { name: 'Konsultasi', type: 'line', data: teknisiEarningsWeekly.map((d) => d.consultations) },
  { name: 'Remote', type: 'line', data: teknisiEarningsWeekly.map((d) => d.remote) },
]

export function TeknisiEarningsChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pendapatan Mingguan</CardTitle>
              <p className="mt-0.5 text-[11px] text-surface-500">Earnings vs sesi konsultasi & remote</p>
            </div>
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-semibold text-primary-700">
              +14% WoW
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={series} type="line" height={260} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
