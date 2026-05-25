'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { revenueMonthly } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export type TransaksiChartData = {
  labels: string[]
  revenueJt: number[]
  transactionCounts: number[]
}

type Props = {
  data?: TransaksiChartData
}

export function TransaksiChart({ data }: Props) {
  const labels = data?.labels ?? revenueMonthly.map((d) => d.month)
  const revenue = data?.revenueJt ?? revenueMonthly.map((d) => d.revenue)
  const transactions = data?.transactionCounts ?? revenueMonthly.map((d) => d.transactions)

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        foreColor: '#71717a',
        animations: { enabled: true, speed: 800, animateGradually: { enabled: true, delay: 60 } },
      },
      colors: ['#10b981', '#06b6d4'],
      stroke: { curve: 'smooth', width: [3, 2] },
      fill: {
        type: ['gradient', 'solid'],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f4f4f5', strokeDashArray: 4, padding: { left: 8, right: 8 } },
      xaxis: {
        categories: labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#71717a', fontSize: '11px' } },
      },
      yaxis: [
        {
          title: { text: 'Revenue (jt)', style: { color: '#71717a', fontSize: '11px', fontWeight: 500 } },
          labels: { style: { colors: '#71717a', fontSize: '11px' }, formatter: (v) => `${v}` },
        },
        {
          opposite: true,
          title: { text: 'Transaksi', style: { color: '#71717a', fontSize: '11px', fontWeight: 500 } },
          labels: { style: { colors: '#71717a', fontSize: '11px' } },
        },
      ],
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', markers: { size: 4 } },
      tooltip: { theme: 'light', shared: true },
    }),
    [labels],
  )

  const series = useMemo(
    () => [
      { name: 'Revenue (jt)', type: 'area' as const, data: revenue },
      { name: 'Transaksi', type: 'line' as const, data: transactions },
    ],
    [revenue, transactions],
  )

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
              <CardTitle>Pendapatan & Transaksi</CardTitle>
              <p className="mt-0.5 text-[11px] text-surface-500">7 hari terakhir (data platform)</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={series} type="line" height={280} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
