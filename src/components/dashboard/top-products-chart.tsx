'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { topProducts as mockTop } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

type ProductItem = { name: string; sales: number }

type Props = {
  data?: ProductItem[]
}

export function TopProductsChart({ data }: Props) {
  const products = data && data.length > 0 ? data : mockTop.map((p) => ({ name: p.name, sales: p.sales }))

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        foreColor: '#71717a',
        animations: { enabled: true, speed: 700 },
      },
      colors: ['#10b981'],
      plotOptions: {
        bar: { borderRadius: 4, horizontal: true, barHeight: '55%' },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#f4f4f5',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      xaxis: {
        categories: products.map((d) => d.name),
        labels: { style: { colors: '#71717a', fontSize: '10px' } },
      },
      yaxis: { labels: { style: { colors: '#52525b', fontSize: '10px', fontWeight: 500 } } },
      tooltip: { theme: 'light' },
    }),
    [products],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.12 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Produk Terlaris</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Unit terjual (marketplace)</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart
            options={options}
            series={[{ name: 'Unit Terjual', data: products.map((d) => d.sales) }]}
            type="bar"
            height={260}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
