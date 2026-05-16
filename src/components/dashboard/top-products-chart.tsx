'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { topProducts } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const options: ApexOptions = {
  chart: {
    toolbar: { show: false },
    foreColor: '#71717a',
    stacked: true,
    animations: { enabled: true, speed: 700 },
  },
  colors: ['#10b981', '#06b6d4'],
  plotOptions: {
    bar: { borderRadius: 4, horizontal: true, barHeight: '55%' },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f4f4f5', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
  xaxis: {
    categories: topProducts.map((d) => d.name),
    labels: { style: { colors: '#71717a', fontSize: '10px' } },
  },
  yaxis: { labels: { style: { colors: '#52525b', fontSize: '10px', fontWeight: 500 } } },
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', markers: { size: 4 } },
  tooltip: { theme: 'light', shared: true, intersect: false },
}

export function TopProductsChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.12 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <div>
            <CardTitle>Produk Terlaris</CardTitle>
            <p className="mt-0.5 text-[11px] text-surface-500">Unit terjual & revenue (jt) bulan ini</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart
            options={options}
            series={[
              { name: 'Unit Terjual', data: topProducts.map((d) => d.sales) },
              { name: 'Revenue (jt)', data: topProducts.map((d) => d.revenue) },
            ]}
            type="bar"
            height={260}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
