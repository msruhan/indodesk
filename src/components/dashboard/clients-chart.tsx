'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { transactionMix } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const options: ApexOptions = {
  labels: transactionMix.map((item) => item.name),
  chart: {
    foreColor: '#737373',
    animations: { enabled: true, speed: 750 },
  },
  colors: ['#16a34a', '#171717', '#22c55e', '#86efac'],
  dataLabels: { enabled: false },
  stroke: { colors: ['#ffffff'], width: 3 },
  legend: { position: 'bottom', labels: { colors: '#525252' } },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            color: '#737373',
            formatter: () => '24,447',
          },
          value: { color: '#171717' },
        },
      },
    },
  },
  tooltip: { theme: 'light', y: { formatter: (value) => `${value}%` } },
}

export function ClientsChart() {
  return (
    <motion.div className="h-full" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
      <Card className="h-full bg-white border border-surface-200">
        <CardHeader className="pb-3 border-b border-surface-200">
          <CardTitle className="text-black">Total Amount</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Chart options={options} series={transactionMix.map((item) => item.value)} type="donut" height={280} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
