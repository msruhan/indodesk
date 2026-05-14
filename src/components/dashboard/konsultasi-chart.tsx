'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { locationTraffic } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const options: ApexOptions = {
  chart: {
    toolbar: { show: false },
    foreColor: '#737373',
    animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 80 } },
  },
  colors: ['#171717'],
  plotOptions: {
    bar: { borderRadius: 8, horizontal: true, barHeight: '52%', distributed: true },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
  xaxis: {
    categories: locationTraffic.map((item) => item.name),
    labels: { style: { colors: '#737373' } },
  },
  yaxis: { labels: { style: { colors: '#525252' } } },
  legend: { show: false },
  tooltip: { theme: 'light', y: { formatter: (value) => `${value}K` } },
}

export function KonsultasiChart() {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.08 }}>
      <Card className="bg-white border border-surface-200">
        <CardHeader className="pb-3 border-b border-surface-200">
          <CardTitle className="text-black">Location Traffic</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Chart
            options={options}
            series={[{ name: 'Sessions', data: locationTraffic.map((item) => item.value) }]}
            type="bar"
            height={300}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
