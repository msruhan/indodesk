'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { transactionMix } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const options: ApexOptions = {
  chart: {
    toolbar: { show: false },
    foreColor: '#71717a',
    animations: { enabled: true, speed: 800 },
  },
  colors: transactionMix.map((d) => d.color),
  labels: transactionMix.map((d) => d.name),
  dataLabels: {
    enabled: true,
    formatter: (val) => `${(val as number).toFixed(0)}%`,
    style: { fontSize: '11px', fontWeight: 600 },
    dropShadow: { enabled: false },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '62%',
        labels: {
          show: true,
          name: { fontSize: '12px', color: '#18181b' },
          value: { fontSize: '18px', fontWeight: 700, color: '#18181b', formatter: (v) => `${v}%` },
          total: {
            show: true,
            label: 'Total',
            fontSize: '11px',
            color: '#71717a',
            formatter: () => '100%',
          },
        },
      },
    },
  },
  stroke: { width: 2, colors: ['#fff'] },
  legend: {
    position: 'bottom',
    fontSize: '11px',
    markers: { size: 6, shape: 'circle' as const },
    itemMargin: { horizontal: 8, vertical: 4 },
  },
  tooltip: { theme: 'light', y: { formatter: (v) => `${v}%` } },
}

export function KonsultasiChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.06 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <div>
            <CardTitle>Distribusi Transaksi</CardTitle>
            <p className="mt-0.5 text-[11px] text-surface-500">Breakdown per kategori layanan</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart
            options={options}
            series={transactionMix.map((d) => d.value)}
            type="donut"
            height={280}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
